import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { jobListing, preparationItem, question, taskTable, dailySetting } from '@server/database/schema';
import type { RecommendedTask, TaskCategory, RecommendedSource, TaskItem, TaskRecurrenceType, RecurrenceConfig } from '@shared/api.interface';

/**
 * 每日任务推荐引擎
 *
 * 推荐来源：
 * 1. 投递任务：今日计划投递的岗位 / 待投递岗位
 * 2. 准备度任务：未完成的准备清单项（按阶段优先级排序）
 * 3. 阶段任务：根据秋招月份（8-11月）推荐阶段性重点任务
 * 4. 训练任务：隔日推荐一道面试题
 * 5. 生活任务：运动、早睡、午休等精力管理任务
 * 6. 周五特别任务：周复盘
 *
 * 精力预算控制：基于每日可用时间（availableHours × 2 = 精力点），
 * 扣除已安排任务的精力，剩余预算内推荐新任务。
 */
@Injectable()
export class DailyRecommendationService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getDailyRecommendations(userId: string, date: string): Promise<RecommendedTask[]> {
    const results: RecommendedTask[] = [];

    const [dailySettingRow, todayTasks] = await Promise.all([
      this.db.select().from(dailySetting)
        .where(and(eq(dailySetting.settingDate, date), eq(dailySetting.userId, userId))).limit(1),
      this.db.select({ energyPoints: taskTable.energyPoints, category: taskTable.category })
        .from(taskTable)
        .where(and(
          sql`(${taskTable.taskDate} IS NOT NULL AND ${taskTable.taskDate} = ${date}::date
            OR ${taskTable.taskDate} IS NULL AND DATE(${taskTable.createdAt}) = ${date}::date)`,
          eq(taskTable.createdBy, userId),
        )),
    ]);

    const energyBudget = dailySettingRow[0]?.availableHours ? dailySettingRow[0].availableHours * 2 : 8;
    const scheduledEnergy = todayTasks.reduce((sum, t) => sum + (t.energyPoints ?? 0), 0);
    const remainingBudget = Math.max(0, energyBudget - scheduledEnergy);

    // 1. 投递任务
    const applicationTasks = await this.getApplicationTasks(userId, date);
    for (const t of applicationTasks) {
      if (this.currentEnergy(results) + t.energyPoints <= remainingBudget) results.push(t);
    }

    // 2. 准备度任务
    const prepCompletion = await this.getPreparationCompletion(userId);
    const prepTasks = await this.getPreparationTasks(userId, prepCompletion.rate);
    const prepCount = prepCompletion.rate < 0.6 ? 2 : 1;
    for (let i = 0; i < Math.min(prepCount, prepTasks.length); i++) {
      if (this.currentEnergy(results) + prepTasks[i].energyPoints <= remainingBudget) results.push(prepTasks[i]);
    }

    // 3. 阶段任务
    const stageTask = this.getStageTask(date);
    if (stageTask && this.currentEnergy(results) + stageTask.energyPoints <= remainingBudget) results.push(stageTask);

    // 4. 训练任务（隔日）
    const dayOfYear = this.dayOfYear(date);
    if (dayOfYear % 2 === 0) {
      const trainingTask = await this.getTrainingTask(userId, dayOfYear);
      if (trainingTask && this.currentEnergy(results) + trainingTask.energyPoints <= remainingBudget) results.push(trainingTask);
    }

    // 5. 生活任务
    const lifeTask = this.getLifeTask(dayOfYear);
    if (this.currentEnergy(results) + lifeTask.energyPoints <= remainingBudget) results.push(lifeTask);

    // 6. 周五复盘
    const weekDay = new Date(date).getDay();
    if (weekDay === 5) {
      const fridayTask: RecommendedTask = {
        id: `rec-stage-weekly-review-${date}`,
        title: '本周复盘：整理投递记录、更新进度、准备下周计划',
        category: 'growth', energyPoints: 2, estimatedMinutes: 45,
        reason: '周五复盘是让求职节奏持续可控的关键仪式', source: 'stage',
      };
      if (this.currentEnergy(results) + fridayTask.energyPoints <= remainingBudget) results.push(fridayTask);
    }

    return results;
  }

  private currentEnergy(results: RecommendedTask[]): number {
    return results.reduce((s, r) => s + r.energyPoints, 0);
  }

  private dayOfYear(dateStr: string): number {
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getApplicationTasks(userId: string, date: string): Promise<RecommendedTask[]> {
    const plannedRows = await this.db.select().from(jobListing)
      .where(and(
        eq(jobListing.status, '待投递'), eq(jobListing.planDate, date), eq(jobListing.isHidden, false),
        sql`(${jobListing.createdBy} IS NOT NULL AND (${jobListing.createdBy}).user_id = ${userId}
          OR ${jobListing.isBuiltin} = true)`,
      )).orderBy(jobListing.priorityDirection).limit(5);

    if (plannedRows.length > 0) {
      return plannedRows.map(row => ({
        id: `rec-app-${row.id}`,
        title: `投递：${row.company.replace(/^\[API_TEST\]\s*/i, '').replace(/^\[E2E_TEST\]\s*/i, '')} - ${row.jobTitle}`,
        category: 'battle' as TaskCategory, energyPoints: 2, estimatedMinutes: 30,
        reason: row.matchNote ? `匹配亮点：${row.matchNote.slice(0, 40)}` : '今日计划投递岗位',
        source: 'application' as RecommendedSource, jobListingId: row.id,
      }));
    }

    const fallbackRows = await this.db.select().from(jobListing)
      .where(and(
        eq(jobListing.status, '待投递'), eq(jobListing.isHidden, false),
        sql`(${jobListing.createdBy} IS NOT NULL AND (${jobListing.createdBy}).user_id = ${userId}
          OR ${jobListing.isBuiltin} = true)`,
      ))
      .orderBy(sql`CASE ${jobListing.priorityDirection} WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 ELSE 4 END`)
      .limit(3);

    return fallbackRows.map(row => ({
      id: `rec-app-${row.id}`,
      title: `投递：${row.company} - ${row.jobTitle}`,
      category: 'battle' as TaskCategory, energyPoints: 2, estimatedMinutes: 30,
      reason: row.matchNote ? `推荐投递：${row.matchNote.slice(0, 40)}` : `优先级 ${row.priorityDirection ?? 'P2'}，今日可安排`,
      source: 'application' as RecommendedSource, jobListingId: row.id,
    }));
  }

  private async getPreparationCompletion(userId: string): Promise<{ total: number; completed: number; rate: number }> {
    const allRows = await this.db.select({ isCompleted: preparationItem.isCompleted })
      .from(preparationItem).where(eq(preparationItem.userId, userId));
    const total = allRows.length;
    const completed = allRows.filter(r => r.isCompleted).length;
    return { total, completed, rate: total > 0 ? completed / total : 1 };
  }

  private async getPreparationTasks(userId: string, completionRate: number): Promise<RecommendedTask[]> {
    const stageOrder = ['resume', 'application_info', 'written_test', 'interview_script', 'readiness'];
    const rows = await this.db.select().from(preparationItem)
      .where(and(eq(preparationItem.userId, userId), eq(preparationItem.isCompleted, false)))
      .orderBy(preparationItem.sortOrder, preparationItem.createdAt);

    rows.sort((a, b) => {
      const ai = stageOrder.indexOf(a.category ?? '');
      const bi = stageOrder.indexOf(b.category ?? '');
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return rows.slice(0, 3).map(row => ({
      id: `rec-prep-${row.id}`,
      title: row.title,
      category: 'growth' as TaskCategory,
      energyPoints: completionRate < 0.5 ? 2 : 1,
      estimatedMinutes: completionRate < 0.5 ? 45 : 25,
      reason: '准备度提升任务',
      source: 'preparation' as RecommendedSource,
      preparationItemId: row.id,
    }));
  }

  private getStageTask(date: string): RecommendedTask | null {
    const STAGE_TASKS: Record<string, Array<{ title: string; reason: string; energyPoints: number; minutes: number }>> = {
      '08': [
        { title: '完善简历定制：针对目标岗位优化项目经历描述', reason: '8月提前批/网申初期，高质量简历是第一关', energyPoints: 2, minutes: 60 },
        { title: '刷行测/笔试题：数字推理+图形推理各10道', reason: '提前批笔试陆续开启，保持手感', energyPoints: 1, minutes: 30 },
        { title: '整理公司投递清单：按优先级排列目标公司', reason: '网申即将全面开启，先做好战略规划', energyPoints: 1, minutes: 30 },
        { title: '模拟面试练习：自我介绍+3个经典BQ题', reason: '提前批面试可能随时到来，提前准备', energyPoints: 2, minutes: 45 },
      ],
      '09': [
        { title: '集中网申：今日投递3家目标公司', reason: '9月正式批高峰，投递是第一优先级', energyPoints: 3, minutes: 90 },
        { title: '笔试复盘：整理近一周错题和知识点盲区', reason: '笔试密集期，复盘比刷新题更重要', energyPoints: 2, minutes: 60 },
        { title: '群面练习：准备3个通用框架和案例', reason: '面试高峰即将到来，群面是重灾区', energyPoints: 2, minutes: 45 },
      ],
      '10': [
        { title: '面试复盘：记录今日面试的亮点与不足', reason: '面试高峰，每次面试都是进步机会', energyPoints: 2, minutes: 30 },
        { title: 'Offer比较分析：列出已收Offer的核心维度对比', reason: 'Offer陆续到来，需要系统化比较', energyPoints: 1, minutes: 30 },
        { title: 'HR面准备：薪资预期+职业规划+反问问题', reason: 'HR面是最后一关，不能掉以轻心', energyPoints: 2, minutes: 45 },
      ],
      '11': [
        { title: '补录岗位关注：筛选还在开放的优质岗位', reason: '补录期信息差是最大的机会', energyPoints: 1, minutes: 30 },
        { title: '已投公司跟进：发跟进邮件/联系HR了解进度', reason: '主动跟进可能获得意外机会', energyPoints: 2, minutes: 45 },
        { title: 'Offer选择决策：用加权评分法做最终选择', reason: '人生第一个Offer选择需要理性决策', energyPoints: 2, minutes: 60 },
      ],
    };

    const month = date.slice(5, 7);
    const tasks = STAGE_TASKS[month];
    if (!tasks) return null;
    const day = parseInt(date.slice(8, 10), 10);
    const t = tasks[(day - 1) % tasks.length];
    return {
      id: `rec-stage-${date}`, title: t.title, category: 'growth',
      energyPoints: t.energyPoints, estimatedMinutes: t.minutes, reason: t.reason, source: 'stage',
    };
  }

  private async getTrainingTask(userId: string, dayOfYear: number): Promise<RecommendedTask | null> {
    const countResult = await this.db.select({ value: sql<number>`COUNT(*)` })
      .from(question).where(eq(question.category, 'interview'));
    const total = Number(countResult[0]?.value ?? 0);
    if (total === 0) return null;
    const offset = dayOfYear % total;
    const rows = await this.db.select().from(question)
      .where(eq(question.category, 'interview')).orderBy(question.createdAt).limit(1).offset(offset);
    if (rows.length === 0) return null;
    const row = rows[0];
    const title = row.title.length > 30 ? row.title.slice(0, 30) + '...' : row.title;
    return {
      id: `rec-training-${row.id}`, title: `面试练习：${title}`,
      category: 'growth', energyPoints: 1, estimatedMinutes: 20,
      reason: '每日一道面试题，保持答题手感和结构化思维', source: 'training', questionId: row.id,
    };
  }

  private getLifeTask(dayOfYear: number): RecommendedTask {
    const LIFE_TASKS = [
      { title: '运动30分钟', reason: '高强度求职期，保持身体健康是底线', energyPoints: 1, minutes: 30 },
      { title: '早睡（23:30前）', reason: '好睡眠是第二天高效的基础', energyPoints: 1, minutes: 0 },
      { title: '午休20分钟', reason: '下午效率的关键投资，别硬撑', energyPoints: 1, minutes: 20 },
      { title: '出门散步15分钟', reason: '换环境让大脑休息，激发创造力', energyPoints: 1, minutes: 15 },
      { title: '和朋友聊聊天', reason: '社交充电，避免孤军奋战的焦虑', energyPoints: 1, minutes: 20 },
      { title: '冥想10分钟', reason: '焦虑期的心灵复位，10分钟换一整天的专注', energyPoints: 1, minutes: 10 },
    ];
    const t = LIFE_TASKS[dayOfYear % LIFE_TASKS.length];
    return {
      id: `rec-life-${dayOfYear}`, title: t.title, category: 'life',
      energyPoints: t.energyPoints, estimatedMinutes: t.minutes, reason: t.reason, source: 'life',
    };
  }
}
