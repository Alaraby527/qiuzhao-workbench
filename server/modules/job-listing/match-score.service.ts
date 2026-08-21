import { Inject, Injectable } from '@nestjs/common';
import { eq, and, count, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';

import {
  resumeInfoTable,
  preparationItemTable,
  answerRecordTable,
  applicationTable,
  jobListingTable,
} from '@server/database/schema';
import type { MatchLevel, MatchScoreDetail } from '@shared/api.interface';

interface UserProfileData {
  degree?: string;
  major?: string;
  school?: string;
  skills: string[];
  internshipCount: number;
  projectCount: number;
  hasResume: boolean;
  resumeVersions: number;
}

interface PreparationData { completedCount: number; totalCount: number; }
interface TrainingData { answeredCount: number; totalQuestions: number; avgScore: number; }
interface ApplicationPreference { topLocations: string[]; topIndustries: string[]; applicationCount: number; }

interface JobRow {
  id: string; company: string; jobTitle: string;
  industry?: string | null; location?: string | null;
  education?: string | null; deadline?: string | null;
  source?: string | null; isBuiltin: boolean;
}

interface ScoreItem { label: string; score: number; maxScore: number; detail: string; }

/**
 * 岗位匹配评分引擎
 *
 * 三维评分模型（满分100）：
 * - 个人信息匹配（40分）：学历、专业方向、地点偏好、公司类型
 * - 求职准备度（35分）：准备清单完成度、训练表现、简历完善度
 * - 岗位特征（25分）：截止时间、竞争烈度、岗位类型
 *
 * 等级划分：≤60冲刺(sprint)、61-80匹配(match)、81-100保底(safe)
 */
@Injectable()
export class MatchScoreService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async calculateForJobs(jobs: JobRow[], userId: string): Promise<MatchScoreDetail[]> {
    const [profile, prep, training, pref] = await Promise.all([
      this.getUserProfile(userId),
      this.getPreparationData(userId),
      this.getTrainingData(userId),
      this.getApplicationPreference(userId),
    ]);
    return jobs.map((job) => this.calcOne(job, profile, prep, training, pref));
  }

  getLevel(score: number): MatchLevel {
    if (score <= 60) return 'sprint';
    if (score <= 80) return 'match';
    return 'safe';
  }

  private calcOne(
    job: JobRow,
    profile: UserProfileData,
    prep: PreparationData,
    training: TrainingData,
    pref: ApplicationPreference,
  ): MatchScoreDetail {
    const personalItems = this.calcPersonalInfo(job, profile, pref);
    const prepItems = this.calcPreparation(prep, training, profile);
    const jobItems = this.calcJobFeature(job, pref);

    const personalScore = personalItems.reduce((s, i) => s + i.score, 0);
    const prepScore = prepItems.reduce((s, i) => s + i.score, 0);
    const jobScore = jobItems.reduce((s, i) => s + i.score, 0);
    const total = Math.round(personalScore + prepScore + jobScore);
    const level = this.getLevel(total);

    const dataSufficient =
      profile.hasResume && prep.totalCount > 0 &&
      (training.answeredCount > 0 || profile.internshipCount > 0);

    const suggestions = this.buildSuggestions(level, personalItems, prepItems, profile, prep, training);

    return {
      totalScore: total,
      level,
      personalInfo: { score: Math.round(personalScore * 10) / 10, maxScore: 40, items: personalItems },
      preparation: { score: Math.round(prepScore * 10) / 10, maxScore: 35, items: prepItems },
      jobFeature: { score: Math.round(jobScore * 10) / 10, maxScore: 25, items: jobItems },
      suggestions,
      dataSufficient,
    };
  }

  private calcPersonalInfo(job: JobRow, profile: UserProfileData, pref: ApplicationPreference): ScoreItem[] {
    const items: ScoreItem[] = [];

    // 学历匹配（15分）
    const eduReq = (job.education || '').toLowerCase();
    let eduScore = 12;
    let eduDetail = '';
    if (!eduReq || eduReq.includes('不限')) {
      eduScore = 15;
      eduDetail = '学历要求不限，满足 ✓';
    } else if (profile.degree) {
      const userLevel = this.degreeLevel(profile.degree);
      const reqLevel = this.educationReqLevel(eduReq);
      if (userLevel >= reqLevel) {
        eduScore = userLevel > reqLevel ? 15 : 12;
        eduDetail = userLevel > reqLevel ? `你的${profile.degree}高于要求 ✓` : `要求${job.education}，你的学历满足 ✓`;
      } else {
        eduScore = Math.max(2, userLevel * 3);
        eduDetail = `要求${job.education}，你的学历为${profile.degree}，有一定差距`;
      }
    } else {
      eduScore = 8;
      eduDetail = '暂未填写学历信息，按默认值计算';
    }
    items.push({ label: '学历匹配', score: eduScore, maxScore: 15, detail: eduDetail });

    // 专业方向匹配（10分）
    const industryText = (job.industry || '').toLowerCase();
    const major = (profile.major || '').toLowerCase();
    let majorScore = 5;
    let majorDetail = '专业匹配度一般';
    const techKeywords = ['人工智能', 'ai', '互联网', '软件', '计算机', '算法', '科技', '新能源', '储能', '芯片', '电子'];
    const isTechIndustry = techKeywords.some(kw => industryText.includes(kw));
    const isTechMajor = major.includes('储能') || major.includes('能源') || major.includes('电气') ||
      major.includes('计算机') || major.includes('软件') || major.includes('电子') ||
      profile.skills.some(s => /ai|python|产品|算法|sql/i.test(s));
    if (isTechIndustry && isTechMajor) {
      majorScore = 10;
      majorDetail = '行业与你的专业/技能方向高度匹配 ✓';
    } else if (isTechIndustry || isTechMajor) {
      majorScore = 7;
      majorDetail = '行业与你的背景有一定相关性';
    }
    if (!profile.hasResume) majorDetail += '（未填写简历，按默认估算）';
    items.push({ label: '专业方向匹配', score: majorScore, maxScore: 10, detail: majorDetail });

    // 地点偏好（10分）
    const locText = job.location || '';
    let locScore = 5;
    let locDetail = '地点匹配度一般';
    if (pref.topLocations.length > 0 && locText) {
      const jobLocs = locText.split(/[\s,，/、]+/).filter(Boolean);
      const hit = jobLocs.some(jl => pref.topLocations.some(pl => jl.includes(pl) || pl.includes(jl)));
      if (hit) {
        locScore = 10;
        locDetail = '地点符合你的投递偏好 ✓';
      } else {
        locScore = 4;
        locDetail = `工作地点不在你的主要投递城市`;
      }
    }
    items.push({ label: '地点偏好', score: locScore, maxScore: 10, detail: locDetail });

    // 公司类型偏好（5分）
    let companyScore = 3;
    let companyDetail = '公司类型匹配度一般';
    if (pref.topIndustries.length > 0) {
      for (const ind of pref.topIndustries) {
        if (industryText.includes(ind)) {
          companyScore = 5;
          companyDetail = '公司类型符合你的投递偏好 ✓';
          break;
        }
      }
    } else if (isTechIndustry) {
      companyScore = 4;
      companyDetail = '科技类公司，与你的方向较契合';
    }
    items.push({ label: '公司类型偏好', score: companyScore, maxScore: 5, detail: companyDetail });

    return items;
  }

  private calcPreparation(prep: PreparationData, training: TrainingData, profile: UserProfileData): ScoreItem[] {
    const items: ScoreItem[] = [];

    // 准备清单完成度（15分）
    const total = Math.max(prep.totalCount, 44);
    const rate = total > 0 ? prep.completedCount / total : 0;
    const prepScore = Math.round(rate * 15 * 10) / 10;
    items.push({
      label: '准备清单完成度',
      score: prepScore,
      maxScore: 15,
      detail: prep.totalCount > 0 ? `已完成 ${prep.completedCount}/${total} 项（${Math.round(rate * 100)}%）` : '准备清单数据不足',
    });

    // 训练中心表现（10分）
    let trainingScore = 0;
    let trainingDetail = '';
    if (profile.internshipCount === 0 && !profile.hasResume) {
      trainingScore = 3;
      trainingDetail = '暂未发现训练记录，建议开始刷题';
    } else {
      const answerRate = training.totalQuestions > 0 ? training.answeredCount / Math.min(training.totalQuestions, 50) : 0;
      const quantityScore = Math.min(5, answerRate * 5);
      const qualityScore = training.avgScore > 0 ? Math.min(5, (training.avgScore / 100) * 5) : 2.5;
      trainingScore = Math.round((quantityScore + qualityScore) * 10) / 10;
      trainingDetail = training.answeredCount > 0
        ? `已完成 ${training.answeredCount} 题，平均得分 ${Math.round(training.avgScore)} 分`
        : '训练数据不足，按基础水平估算';
    }
    items.push({ label: '训练中心表现', score: trainingScore, maxScore: 10, detail: trainingDetail });

    // 简历完善度（10分）
    let resumeScore = 5;
    let resumeDetail = '';
    if (!profile.hasResume) {
      resumeScore = 2;
      resumeDetail = '简历尚未完善，建议尽快填写';
    } else {
      let completeness = 0;
      if (profile.degree || profile.school) completeness++;
      if (profile.internshipCount > 0) completeness++;
      if (profile.projectCount > 0) completeness++;
      if (profile.skills.length > 0) completeness++;
      const baseScore = (completeness / 4) * 5;
      const versionBonus = profile.resumeVersions >= 2 ? 5 : profile.resumeVersions === 1 ? 2.5 : 0;
      resumeScore = Math.round((baseScore + versionBonus) * 10) / 10;
      resumeDetail = `简历完成度 ${Math.round((completeness / 4) * 100)}%，${profile.resumeVersions} 个版本`;
    }
    items.push({ label: '简历完善度', score: resumeScore, maxScore: 10, detail: resumeDetail });

    return items;
  }

  private calcJobFeature(job: JobRow, _pref: ApplicationPreference): ScoreItem[] {
    const items: ScoreItem[] = [];

    // 截止时间（10分）
    let deadlineScore = 7;
    let deadlineDetail = '招满即止或未明确截止';
    const days = this.parseDeadlineDays(job.deadline || '');
    if (days !== null) {
      if (days <= 3) { deadlineScore = 3; deadlineDetail = `还有 ${days} 天截止，时间紧张 ⚠`; }
      else if (days <= 7) { deadlineScore = 6; deadlineDetail = `还有 ${days} 天截止，时间较紧`; }
      else if (days <= 30) { deadlineScore = 9; deadlineDetail = `还有 ${days} 天截止，准备时间充足 ✓`; }
      else { deadlineScore = 10; deadlineDetail = `还有 ${days} 天截止，时间充裕 ✓`; }
    }
    items.push({ label: '截止时间', score: deadlineScore, maxScore: 10, detail: deadlineDetail });

    // 竞争烈度（10分）
    let competitionScore = 7;
    let competitionDetail = '竞争程度中等';
    const bigCompanyKeywords = ['腾讯', '阿里', '字节', '百度', '华为', '美团', '京东', '拼多多', '网易', '小米', '快手', '滴滴'];
    const isBig = bigCompanyKeywords.some(kw => (job.company || '').includes(kw));
    const hotIndustry = /互联网|AI|人工智能|算法|产品经理|新能源|芯片|金融|咨询/i.test(job.industry || '') ||
      /互联网|AI|算法|产品|新能源|芯片|金融|咨询/i.test(job.company || '');
    if (isBig && hotIndustry) {
      competitionScore = 5;
      competitionDetail = '知名大厂+热门行业，竞争激烈';
    } else if (isBig || hotIndustry) {
      competitionScore = 7;
      competitionDetail = isBig ? '知名公司，竞争较激烈' : '热门行业，竞争较激烈';
    } else {
      competitionScore = 9;
      competitionDetail = '中小公司/冷门方向，竞争相对温和';
    }
    items.push({ label: '竞争烈度', score: competitionScore, maxScore: 10, detail: competitionDetail });

    // 岗位类型匹配（5分）
    items.push({ label: '岗位类型匹配', score: 3, maxScore: 5, detail: '岗位类型与你投递历史匹配度一般' });

    return items;
  }

  private buildSuggestions(
    level: MatchLevel,
    personalItems: ScoreItem[],
    prepItems: ScoreItem[],
    _jobItems: ScoreItem[],
    profile: UserProfileData,
    prep: PreparationData,
    training: TrainingData,
  ): string[] {
    const suggestions: string[] = [];
    if (level === 'sprint') suggestions.push('这是冲刺岗位，建议尽早投递，提前针对性准备面试');
    else if (level === 'match') suggestions.push('匹配度较高，建议按计划投递，重点打磨简历和面试表现');
    else suggestions.push('保底岗位，成功率较高，可作为投递计划的安全垫');

    const lowestPersonal = [...personalItems].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)[0];
    const lowestPrep = [...prepItems].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)[0];
    if (lowestPersonal && lowestPersonal.score / lowestPersonal.maxScore < 0.6)
      suggestions.push(`「${lowestPersonal.label}」得分偏低，建议重点提升`);
    if (lowestPrep && lowestPrep.score / lowestPrep.maxScore < 0.6)
      suggestions.push(`「${lowestPrep.label}」得分偏低，建议优先完善`);
    if (!profile.hasResume) suggestions.push('尽快完善简历信息，匹配分析会更精准');
    if (prep.completedCount < 10) suggestions.push('准备清单完成度较低，建议先完成基础准备项');
    if (training.answeredCount < 5 && profile.internshipCount === 0)
      suggestions.push('建议多刷训练题，提升笔面试竞争力');
    return suggestions.slice(0, 4);
  }

  private degreeLevel(degree: string): number {
    const d = degree.toLowerCase();
    if (d.includes('博士') || d.includes('phd')) return 4;
    if (d.includes('硕士') || d.includes('研究生') || d.includes('master')) return 3;
    if (d.includes('本科') || d.includes('学士') || d.includes('bachelor')) return 2;
    if (d.includes('大专') || d.includes('专科')) return 1;
    return 0;
  }

  private educationReqLevel(req: string): number {
    const r = req.toLowerCase();
    if (r.includes('博士') || r.includes('phd')) return 4;
    if (r.includes('硕士') || r.includes('研究生')) return 3;
    if (r.includes('本科')) return 2;
    if (r.includes('大专') || r.includes('专科')) return 1;
    return 2;
  }

  private parseDeadlineDays(deadline: string): number | null {
    if (!deadline) return null;
    const cleaned = deadline.replace(/[年月年]/g, '.').replace(/[日号]/g, '');
    const match = cleaned.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (match) {
      const target = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }
    const m2 = cleaned.match(/(\d{1,2})\.(\d{1,2})/);
    if (m2) {
      const now = new Date();
      const target = new Date(now.getFullYear(), parseInt(m2[1]) - 1, parseInt(m2[2]));
      if (target.getTime() < now.getTime()) target.setFullYear(now.getFullYear() + 1);
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    return null;
  }

  private async getUserProfile(userId: string): Promise<UserProfileData> {
    const rows = await this.db.select().from(resumeInfoTable)
      .where(and(eq(sql`(${resumeInfoTable.createdBy}).user_id`, userId))).limit(1);
    if (rows.length === 0) {
      return { degree: undefined, major: undefined, school: undefined, skills: [],
        internshipCount: 0, projectCount: 0, hasResume: false, resumeVersions: 0 };
    }
    const row = rows[0];
    const basicInfo = (row.basicInfo && typeof row.basicInfo === 'object') ? row.basicInfo as Record<string, unknown> : {};
    const education = Array.isArray(row.education) ? row.education as Array<Record<string, unknown>> : [];
    const internships = Array.isArray(row.internships) ? row.internships as unknown[] : [];
    const projects = Array.isArray(row.projects) ? row.projects as unknown[] : [];
    const skills = Array.isArray(row.skills) ? row.skills as string[] : [];
    const latestEdu = education[0] ?? {};
    return {
      degree: (latestEdu.degree as string) || (basicInfo.degree as string) || undefined,
      major: (latestEdu.major as string) || (basicInfo.major as string) || undefined,
      school: (latestEdu.school as string) || (basicInfo.school as string) || undefined,
      skills, internshipCount: internships.length, projectCount: projects.length,
      hasResume: education.length > 0 || internships.length > 0 || basicInfo.name != null || skills.length > 0,
      resumeVersions: 1,
    };
  }

  private async getPreparationData(userId: string): Promise<PreparationData> {
    const [totalResult, completedResult] = await Promise.all([
      this.db.select({ value: count() }).from(preparationItemTable).where(eq(preparationItemTable.userId, userId)),
      this.db.select({ value: count() }).from(preparationItemTable)
        .where(and(eq(preparationItemTable.userId, userId), eq(preparationItemTable.isCompleted, true))),
    ]);
    return { totalCount: Number(totalResult[0]?.value ?? 0), completedCount: Number(completedResult[0]?.value ?? 0) };
  }

  private async getTrainingData(userId: string): Promise<TrainingData> {
    const answered = await this.db.select({ count: count(), avg: sql<number>`AVG(${answerRecordTable.coverageScore})` })
      .from(answerRecordTable).where(eq(sql`(${answerRecordTable.createdBy}).user_id`, userId));
    return { answeredCount: Number(answered[0]?.count ?? 0), totalQuestions: 30, avgScore: Number(answered[0]?.avg ?? 0) || 0 };
  }

  private async getApplicationPreference(userId: string): Promise<ApplicationPreference> {
    const rows = await this.db.select({ company: applicationTable.company, position: applicationTable.position })
      .from(applicationTable)
      .where(and(eq(sql`(${applicationTable.createdBy}).user_id`, userId), eq(applicationTable.isEffective, true)))
      .limit(50);
    const locationCount = new Map<string, number>();
    const industryCount = new Map<string, number>();
    for (const row of rows) {
      const cityPattern = /(北京|上海|深圳|广州|杭州|成都|南京|武汉|西安|苏州|厦门|长沙|重庆|天津)/;
      const m = (row.company || '').match(cityPattern);
      if (m) locationCount.set(m[1], (locationCount.get(m[1]) ?? 0) + 1);
      for (const kw of ['科技', '互联网', '软件', 'AI', '人工智能', '新能源', '芯片']) {
        if ((row.company || '').includes(kw)) { industryCount.set(kw, (industryCount.get(kw) ?? 0) + 1); break; }
      }
    }
    return {
      topLocations: [...locationCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([loc]) => loc),
      topIndustries: [...industryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([ind]) => ind),
      applicationCount: rows.length,
    };
  }
}
