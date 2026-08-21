/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, foreignKey, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

// ============================================================
// 业务表定义（共39张表）
// ============================================================

// 投递记录表
export const application = pgTable("application", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  jobDescription: text("job_description"),
  channel: varchar("channel", { length: 50 }).notNull().default('official'),
  resumeVersion: varchar("resume_version", { length: 100 }),
  tier: varchar("tier", { length: 50 }).notNull().default('match'),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  appliedAt: customTimestamptz("applied_at", { precision: 3 }),
  history: jsonb("history").default('[]'),
  notes: text("notes"),
  resumeVersionId: uuid("resume_version_id"),
  jobMatchLevel: varchar("job_match_level", { length: 20 }).notNull().default('match'),
  isEffective: boolean("is_effective").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_application_status").on(table.status),
  index("idx_application_channel").on(table.channel),
  index("idx_application_tier").on(table.tier),
  foreignKey({
    columns: [table.resumeVersionId],
    foreignColumns: [resumeVersion.id],
    name: "application_resume_version_id_fkey",
  }).onDelete("set null"),
]);

// 任务表
export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 10 }).notNull().default('P3'),
  energyLevel: varchar("energy_level", { length: 20 }).notNull().default('medium'),
  quadrant: varchar("quadrant", { length: 30 }).notNull().default('important_not_urgent'),
  dueDate: customTimestamptz("due_date", { precision: 3 }),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  isFrog: boolean("is_frog").notNull().default(false),
  isRecommended: boolean("is_recommended").notNull().default(false),
  sourceSystemId: uuid("source_system_id"),
  energyPoints: integer("energy_points").notNull().default(2),
  category: varchar("category", { length: 20 }).notNull().default('battle'),
  source: varchar("source", { length: 30 }).notNull().default('manual'),
  weeklyTaskId: uuid("weekly_task_id"),
  taskDate: date("task_date"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  scheduledAt: customTimestamptz("scheduled_at", { precision: 3 }),
  recurrenceType: varchar("recurrence_type", { length: 20 }).notNull().default('none'),
  recurrenceConfig: jsonb("recurrence_config"),
  parentTaskId: uuid("parent_task_id"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_task_status").on(table.status),
  index("idx_task_priority").on(table.priority),
  index("idx_task_task_date").on(table.taskDate),
  index("idx_task_recurrence_type").on(table.recurrenceType),
]);

// 打卡表
export const checkIn = pgTable("check_in", {
  id: uuid("id").primaryKey().defaultRandom(),
  energy: varchar("energy", { length: 10 }).notNull(),
  emotion: varchar("emotion", { length: 20 }).notNull(),
  sleepHours: numeric("sleep_hours"),
  note: text("note"),
  checkInDate: date("check_in_date").notNull(),
  timeOfDay: varchar("time_of_day", { length: 20 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_check_in_date").on(table.checkInDate),
]);

// 复盘表
export const review = pgTable("review", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewType: varchar("review_type", { length: 20 }).notNull(),
  reviewDate: date("review_date").notNull(),
  content: jsonb("content").notNull().default('{}'),
  score: integer("score"),
  relatedApplicationId: uuid("related_application_id"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_review_type").on(table.reviewType),
  index("idx_review_date").on(table.reviewDate),
]);

// 题库表
export const question = pgTable("question", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 20 }).notNull(),
  subCategory: varchar("sub_category", { length: 50 }),
  title: text("title").notNull(),
  referenceAnswer: text("reference_answer"),
  userAnswer: text("user_answer"),
  reviewNotes: text("review_notes"),
  masteryLevel: varchar("mastery_level", { length: 20 }).notNull().default('new'),
  isWrong: boolean("is_wrong").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
  lastPracticedAt: customTimestamptz("last_practiced_at", { precision: 3 }),
  difficulty: varchar("difficulty", { length: 20 }).default('medium'),
  analysis: text("analysis"),
  keyPoints: jsonb("key_points").default('[]'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_question_category").on(table.category),
  index("idx_question_sub_category").on(table.subCategory),
]);

// 答题记录表
export const answerRecord = pgTable("answer_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull(),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  practicedAt: customTimestamptz("practiced_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  coverageScore: integer("coverage_score"),
  missedPoints: jsonb("missed_points").notNull().default('[]'),
  isReviewed: boolean("is_reviewed").notNull().default(false),
  analysisDetail: jsonb("analysis_detail").notNull().default('{}'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_answer_record_question").on(table.questionId),
  index("idx_answer_record_practiced").on(table.practicedAt),
]);

// 简历信息表
export const resumeInfo = pgTable("resume_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  basicInfo: jsonb("basic_info").default('{}'),
  education: jsonb("education").default('[]'),
  internships: jsonb("internships").default('[]'),
  projects: jsonb("projects").default('[]'),
  skills: jsonb("skills").default('[]'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// 简历版本表
export const resumeVersion = pgTable("resume_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  tags: jsonb("tags").notNull().default('[]'),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  summary: text("summary"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_resume_version_default").on(table.isDefault),
]);

// 岗位清单表
export const jobListing = pgTable("job_listing", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description"),
  location: text("location"),
  education: varchar("education", { length: 200 }),
  deadline: varchar("deadline", { length: 255 }),
  openDate: varchar("open_date", { length: 100 }),
  noticeUrl: text("notice_url"),
  applyUrl: text("apply_url"),
  source: varchar("source", { length: 50 }),
  companyTier: varchar("company_tier", { length: 20 }),
  isHidden: boolean("is_hidden").notNull().default(false),
  jobType: varchar("job_type", { length: 20 }),
  priorityDirection: varchar("priority_direction", { length: 50 }),
  matchNote: text("match_note"),
  planDate: date("plan_date"),
  planSlot: varchar("plan_slot", { length: 30 }),
  status: varchar("status", { length: 20 }).default('待投递'),
  note: text("note"),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_job_listing_company").on(table.company),
  index("idx_job_listing_industry").on(table.industry),
  index("idx_job_listing_location").on(table.location),
]);

// BOSS直聘每日统计表
export const bossDailyStats = pgTable("boss_daily_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  statDate: date("stat_date").notNull(),
  greetedCount: integer("greeted_count").notNull().default(0),
  readCount: integer("read_count").notNull().default(0),
  repliedCount: integer("replied_count").notNull().default(0),
  resumeExchangedCount: integer("resume_exchanged_count").notNull().default(0),
  interviewCount: integer("interview_count").notNull().default(0),
  resumeNotes: text("resume_notes"),
  interviewNotes: text("interview_notes"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// 每日设置表
export const dailySetting = pgTable("daily_setting", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  settingDate: date("setting_date").notNull().unique(),
  availableHours: integer("available_hours").notNull().default(8),
  dayStartTime: varchar("day_start_time", { length: 10 }).notNull().default('09:00'),
  dayEndTime: varchar("day_end_time", { length: 10 }).notNull().default('18:00'),
  timeSlots: jsonb("time_slots").notNull().default('[]'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_daily_setting_user_date").on(table.settingDate),
]);

// 准备清单项表
export const preparationItem = pgTable("preparation_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  itemKey: varchar("item_key", { length: 100 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_prep_user_item_key").on(table.userId, table.itemKey),
  index("idx_prep_user_category").on(table.userId, table.category),
]);

// 阶段检测表
export const stageCheck = pgTable("stage_check", {
  id: uuid("id").primaryKey().defaultRandom(),
  readiness: varchar("readiness", { length: 5 }).notNull(),
  checklist: jsonb("checklist").notNull().default('{}'),
  suggestion: text("suggestion"),
  checkDate: date("check_date").notNull(),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_stage_check_date").on(table.checkDate),
]);

// 便签表
export const scrapNote = pgTable("scrap_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  isProcessed: boolean("is_processed").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_scrap_note_processed").on(table.isProcessed),
]);

// 小系统表
export const miniSystem = pgTable("mini_system", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  systemType: varchar("system_type", { length: 30 }).notNull(),
  content: text("content").notNull(),
  sourceReviewId: uuid("source_review_id"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_mini_system_type").on(table.systemType),
]);

// 版本信息表
export const osVersion = pgTable("os_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: varchar("version", { length: 50 }).notNull().unique(),
  description: text("description"),
  relatedSystemId: uuid("related_system_id"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_os_version_version").on(table.version),
]);

// 月度目标表
export const monthlyGoal = pgTable("monthly_goal", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  month: varchar("month", { length: 7 }).notNull(),
  progress: integer("progress").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_monthly_goal_user_month").on(table.userId, table.month),
]);

// 周任务表
export const weeklyTask = pgTable("weekly_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  weeklyLabel: varchar("weekly_label", { length: 20 }).notNull(),
  monthlyGoalId: uuid("monthly_goal_id"),
  estimatedEnergy: integer("estimated_energy").notNull().default(2),
  dueDate: date("due_date"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_weekly_task_user_week").on(table.userId, table.weeklyLabel),
]);

// 待办池表
export const backlogItem = pgTable("backlog_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull().default('battle'),
  energyPoints: integer("energy_points").notNull().default(2),
  source: varchar("source", { length: 30 }).notNull().default('manual'),
  sourceReference: varchar("source_reference", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default('backlog'),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_backlog_user_status").on(table.userId, table.status),
]);

// 脚本模板表
export const scriptTemplate = pgTable("script_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 30 }).notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables").default('[]'),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_script_template_type").on(table.templateType),
]);

// 自动投递记录表
export const autoApplyRecord = pgTable("auto_apply_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }),
  appliedAt: customTimestamptz("applied_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  status: varchar("status", { length: 50 }).default('success'),
  extRecordId: varchar("ext_record_id", { length: 255 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_auto_apply_channel").on(table.channel),
]);

// ============================================================
// 训练中心相关表
// ============================================================

// 方法论模块表
export const methodologyModule = pgTable("methodology_module", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_methodology_module_sort").on(table.sortOrder),
]);

// 方法论卡片表
export const methodologyCard = pgTable("methodology_card", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  coreSummary: text("core_summary").notNull(),
  content: text("content").notNull(),
  applicableScene: text("applicable_scene"),
  sortOrder: integer("sort_order").notNull().default(0),
  relatedQuestionIds: uuid("related_question_ids").array().notNull().default([]),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_methodology_card_module").on(table.moduleId),
  foreignKey({
    columns: [table.moduleId],
    foreignColumns: [methodologyModule.id],
    name: "methodology_card_module_id_fkey",
  }).onDelete("cascade"),
]);

// 薄弱点表
export const weakPoint = pgTable("weak_point", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  pointKey: varchar("point_key", { length: 200 }).notNull(),
  pointTitle: varchar("point_title", { length: 200 }).notNull(),
  questionId: uuid("question_id"),
  methodologyCardId: uuid("methodology_card_id"),
  firstMissedAt: customTimestamptz("first_missed_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastMissedAt: customTimestamptz("last_missed_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  missCount: integer("miss_count").notNull().default(1),
  isMastered: boolean("is_mastered").notNull().default(false),
  masteredAt: customTimestamptz("mastered_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("weak_point_user_key_unique").on(table.userId, table.pointKey),
  index("idx_weak_point_user").on(table.userId),
]);

// ============================================================
// 知识库相关表
// ============================================================

export const knowledgeChapter = pgTable("knowledge_chapter", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 100 }).notNull(),
  summary: text("summary"),
  sortOrder: integer("sort_order").notNull().default(0),
  icon: varchar("icon", { length: 20 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_chapter_sort").on(table.sortOrder),
]);

export const knowledgeSection = pgTable("knowledge_section", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_section_chapter").on(table.chapterId),
  foreignKey({
    columns: [table.chapterId],
    foreignColumns: [knowledgeChapter.id],
    name: "knowledge_section_chapter_id_fkey",
  }).onDelete("cascade"),
]);

export const knowledgeCard = pgTable("knowledge_card", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  keyPoints: jsonb("key_points").notNull().default('[]'),
  relatedQuestionIds: uuid("related_question_ids").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  promptTemplates: jsonb("prompt_templates").notNull().default('[]'),
  fillableTemplates: jsonb("fillable_templates").notNull().default('[]'),
  checklists: jsonb("checklists").notNull().default('[]'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_card_section").on(table.sectionId),
  foreignKey({
    columns: [table.sectionId],
    foreignColumns: [knowledgeSection.id],
    name: "knowledge_card_section_id_fkey",
  }).onDelete("cascade"),
]);

export const knowledgeDoc = pgTable("knowledge_doc", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_doc_category").on(table.category),
]);

// ============================================================
// AI早报/产品案例/交互拆解相关表
// ============================================================

export const aiBriefing = pgTable("ai_briefing", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueNo: varchar("issue_no", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  publishDate: date("publish_date"),
  coreContent: text("core_content"),
  interviewTips: jsonb("interview_tips").default('[]'),
  questions: jsonb("questions").default('[]'),
  sortOrder: integer("sort_order").default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_briefing_sort").on(table.sortOrder),
]);

export const aiBriefingPractice = pgTable("ai_briefing_practice", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  briefingId: uuid("briefing_id").notNull(),
  questionId: varchar("question_id", { length: 50 }).notNull(),
  userAnswer: text("user_answer"),
  coverageScore: integer("coverage_score").default(0),
  missedPoints: jsonb("missed_points").default('[]'),
  analysisDetail: jsonb("analysis_detail").default('{}'),
  isMastered: boolean("is_mastered").default(false),
  reviewNotes: text("review_notes"),
  practicedAt: customTimestamptz("practiced_at", { precision: 6 }).default(sql`now()`),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ab_practice_user").on(table.userId),
  index("idx_ab_practice_briefing").on(table.briefingId),
  foreignKey({
    columns: [table.briefingId],
    foreignColumns: [aiBriefing.id],
    name: "ai_briefing_practice_briefing_id_fkey",
  }),
]);

export const productCase = pgTable("product_case", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeNo: varchar("episode_no", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  tagline: text("tagline"),
  coreMetrics: jsonb("core_metrics").default('[]'),
  companyOverview: text("company_overview"),
  userPainPoints: text("user_pain_points"),
  coreProducts: text("core_products"),
  techArchitecture: text("tech_architecture"),
  businessModel: text("business_model"),
  growthStrategy: text("growth_strategy"),
  competitiveLandscape: text("competitive_landscape"),
  strengthsRisks: text("strengths_risks"),
  pmThinking: text("pm_thinking"),
  oneLiner: text("one_liner"),
  questions: jsonb("questions").default('[]'),
  sortOrder: integer("sort_order").default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_product_case_sort").on(table.sortOrder),
]);

export const productCasePractice = pgTable("product_case_practice", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  caseId: uuid("case_id").notNull(),
  questionId: varchar("question_id", { length: 50 }).notNull(),
  userAnswer: text("user_answer"),
  coverageScore: integer("coverage_score").default(0),
  missedPoints: jsonb("missed_points").default('[]'),
  analysisDetail: jsonb("analysis_detail").default('{}'),
  isMastered: boolean("is_mastered").default(false),
  reviewNotes: text("review_notes"),
  practicedAt: customTimestamptz("practiced_at", { precision: 6 }).default(sql`now()`),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_pc_practice_user").on(table.userId),
  index("idx_pc_practice_case").on(table.caseId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [productCase.id],
    name: "product_case_practice_case_id_fkey",
  }),
]);

export const interactionCase = pgTable("interaction_case", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeNo: varchar("episode_no", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 100 }).notNull(),
  coreInsight: text("core_insight").notNull(),
  background: text("background").notNull(),
  designPoints: jsonb("design_points").notNull().default('[]'),
  transferPrinciples: jsonb("transfer_principles").notNull().default('[]'),
  questions: jsonb("questions").notNull().default('[]'),
  sortOrder: integer("sort_order").notNull().default(0),
  interviewScript: text("interview_script"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_interaction_case_sort").on(table.sortOrder),
]);

export const interactionPractice = pgTable("interaction_practice", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id").notNull(),
  questionId: varchar("question_id", { length: 100 }).notNull(),
  userAnswer: text("user_answer"),
  coverageScore: integer("coverage_score"),
  missedPoints: jsonb("missed_points").notNull().default('[]'),
  isMastered: boolean("is_mastered").notNull().default(false),
  practicedAt: customTimestamptz("practiced_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewNotes: text("review_notes"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_interaction_practice_case").on(table.caseId),
]);

// ============================================================
// AI助手相关表
// ============================================================

export const skill = pgTable("skill", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 20 }).notNull().default('⚙️'),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  promptContent: text("prompt_content").notNull(),
  applicableScenes: jsonb("applicable_scenes").notNull().default('[]'),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_skill_category").on(table.category),
]);

export const skillSession = pgTable("skill_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  answers: jsonb("answers").notNull().default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  resultContent: text("result_content"),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  analysisResult: jsonb("analysis_result"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_skill_session_skill_id").on(table.skillId),
  index("idx_skill_session_status").on(table.status),
]);

export const aiConversation = pgTable("ai_conversation", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id"),
  title: varchar("title", { length: 255 }).notNull().default('新对话'),
  messages: jsonb("messages").notNull().default('[]'),
  currentStep: integer("current_step").notNull().default(0),
  answers: jsonb("answers").notNull().default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('in_progress'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_conv_skill_id").on(table.skillId),
]);

export const aiSavedResult = pgTable("ai_saved_result", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id"),
  conversationId: uuid("conversation_id"),
  resultType: varchar("result_type", { length: 50 }).notNull().default('markdown'),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_sr_skill_id").on(table.skillId),
]);

export const aiSetting = pgTable("ai_setting", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiEndpoint: varchar("api_endpoint", { length: 500 }).notNull().default('https://api.openai.com/v1'),
  apiKey: text("api_key").notNull(),
  model: varchar("model", { length: 100 }).notNull().default('gpt-4o-mini'),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: userProfile("_created_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: userProfile("_updated_by").default(sql`CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// ============================================================
// Table aliases
// ============================================================

export const aiBriefingTable = aiBriefing;
export const aiBriefingPracticeTable = aiBriefingPractice;
export const aiConversationTable = aiConversation;
export const aiSavedResultTable = aiSavedResult;
export const aiSettingTable = aiSetting;
export const answerRecordTable = answerRecord;
export const applicationTable = application;
export const autoApplyRecordTable = autoApplyRecord;
export const backlogItemTable = backlogItem;
export const bossDailyStatsTable = bossDailyStats;
export const checkInTable = checkIn;
export const dailySettingTable = dailySetting;
export const interactionCaseTable = interactionCase;
export const interactionPracticeTable = interactionPractice;
export const jobListingTable = jobListing;
export const knowledgeCardTable = knowledgeCard;
export const knowledgeChapterTable = knowledgeChapter;
export const knowledgeDocTable = knowledgeDoc;
export const knowledgeSectionTable = knowledgeSection;
export const methodologyCardTable = methodologyCard;
export const methodologyModuleTable = methodologyModule;
export const miniSystemTable = miniSystem;
export const monthlyGoalTable = monthlyGoal;
export const osVersionTable = osVersion;
export const preparationItemTable = preparationItem;
export const productCaseTable = productCase;
export const productCasePracticeTable = productCasePractice;
export const questionTable = question;
export const resumeInfoTable = resumeInfo;
export const resumeVersionTable = resumeVersion;
export const reviewTable = review;
export const scrapNoteTable = scrapNote;
export const scriptTemplateTable = scriptTemplate;
export const skillTable = skill;
export const skillSessionTable = skillSession;
export const stageCheckTable = stageCheck;
export const taskTable = task;
export const weakPointTable = weakPoint;
export const weeklyTaskTable = weeklyTask;
