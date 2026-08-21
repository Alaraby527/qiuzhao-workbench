# 秋招工作台 (Qiuzhao Workbench)

> AI产品岗应届生全流程求职管理系统 — 从投递追踪到面试复盘，从每日节律到能力训练的一站式工作台

## 项目简介

秋招工作台是一款面向应届生（尤其是AI产品/产品运营方向）的全流程求职管理Web应用。基于 NestJS + React + Drizzle ORM 全栈架构，集成岗位管理、投递看板、每日任务节律、面试复盘、训练中心、简历管理、AI助手等核心模块，帮助求职者系统化管理秋招全流程。

## 核心功能

### 1. 首页仪表盘 (HomePage)
- 今日状态概览：精力值、任务完成率、投递进度
- 每日推荐任务：基于阶段、准备度、精力预算的智能推荐
- 周度统计与阶段准备度
- 快速打卡入口

### 2. 岗位清单 (JobsPage)
- 内置岗位库初始化（筛选非技术岗、非硕博要求岗位）
- 岗位解析：支持文本/图片/链接三种方式导入岗位信息
- 匹配度分析：基于学历、专业、地点、准备度、训练表现的多维评分
- 投递看板：待投递/已投递/面试中/Offer等状态管理
- BOSS直聘数据统计：打招呼→已读→回复→交换简历→约面试漏斗分析

### 3. 每日节律 (RhythmPage)
- 时间轴视图：按时间段展示任务安排
- 每日设置：可用时间段、精力预算配置
- 任务推荐引擎：基于秋招阶段（8-11月）的阶段性任务推荐
- 精力值管理：高/中/低精力任务分配

### 4. 训练中心 (TrainingHubPage)
- 面试题库：产品Sense、AI早报、交互拆解等分类
- 答案智能评估：基于关键词覆盖度的评分与要点分析
- 学习仪表盘：训练统计、薄弱点识别、复习推荐
- 知识库：产品案例库、AI早报、产品思维训练、交互拆解
- 技能训练：方法论学习与实战练习

### 5. 简历管理
- 简历信息结构化存储（基本信息、教育、实习、项目、技能）
- 多版本管理：针对不同岗位方向的简历版本
- 默认简历设置与版本统计

### 6. 面试复盘
- 面试记录与复盘笔记
- 按类型分类（笔试/群面/业务面/HR面等）
- 复盘模板引导结构化反思

### 7. 求职准备度检测
- 44项准备清单，覆盖8大类别：
  - 准备度总览、简历、网申信息、面试逐字稿
  - 笔试准备、项目经历、打招呼模板
- A/B/C等级评定与改进建议

### 8. AI助手
- 自定义API配置（支持OpenAI兼容接口）
- 对话管理与结果保存
- 连接测试

### 9. 其他功能
- 习惯打卡（每日签到）
- 便签记录
- 月度目标与周任务
- 待办事项池（Backlog）
- PWA支持（可安装到桌面/手机）

## 技术架构

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│  React 19 + TypeScript + Vite               │
│  Tailwind CSS 4 + shadcn/ui                 │
│  React Router v6 + TanStack Query           │
│  Zustand + React Hook Form                  │
├─────────────────────────────────────────────┤
│                   Server                     │
│  NestJS 10 + TypeScript                     │
│  Drizzle ORM + PostgreSQL                   │
│  Class Validator + Swagger                  │
├─────────────────────────────────────────────┤
│                  Shared                      │
│  API 接口类型定义 (api.interface.ts)         │
└─────────────────────────────────────────────┘
```

### 服务端模块

| 模块 | 路径 | 功能 |
|------|------|------|
| Application | server/modules/application | 投递记录CRUD、看板、统计 |
| Task | server/modules/task | 任务管理、每日设置、推荐引擎 |
| CheckIn | server/modules/check-in | 每日打卡 |
| Review | server/modules/review | 面试复盘 |
| Training | server/modules/training | 训练统计、仪表盘、薄弱点 |
| Resume | server/modules/resume | 简历信息与版本管理 |
| StageCheck | server/modules/stage-check | 阶段检测 |
| Rhythm | server/modules/rhythm | 节律分析 |
| JobListing | server/modules/job-listing | 岗位清单、解析、匹配评分 |
| Dashboard | server/modules/dashboard | 首页数据聚合 |
| Preparation | server/modules/preparation | 求职准备度清单 |
| BossGreeting | server/modules/boss-greeting | BOSS直聘数据漏斗 |
| Ai | server/modules/ai | AI对话与配置 |
| MonthlyGoal | server/modules/monthly-goal | 月度目标 |
| WeeklyTask | server/modules/weekly-task | 周任务 |
| Backlog | server/modules/backlog | 待办池 |
| MiniSystem | server/modules/mini-system | 小系统管理 |
| OsVersion | server/modules/os-version | 版本信息 |
| ScrapNote | server/modules/scrap-note | 便签 |

### 数据库

使用 Drizzle ORM + PostgreSQL，共25+张表，核心表包括：
- `application` - 投递记录
- `task` - 任务
- `job_listing` - 岗位清单
- `resume_info` / `resume_version` - 简历
- `question` / `answer_record` - 题库与答题记录
- `review` - 复盘
- `check_in` - 打卡
- `preparation_item` - 准备清单项
- `boss_daily_stats` - BOSS直聘每日统计
- `daily_setting` - 每日设置
- `monthly_goal` / `weekly_task` / `backlog_item` - 目标管理

## 版本历史

- **v2.x** (当前) - 全栈重构版：NestJS + React + Drizzle ORM，新增岗位匹配引擎、训练中心、AI助手等
- **v1.x** - 静态PWA版：纯HTML/CSS/JS单文件应用，使用Firebase + IndexedDB（代码保留在git历史中）

## 本地开发

```bash
# 安装依赖
npm install

# 开发模式（同时启动server和client）
npm run dev

# 构建
npm run build

# 类型检查
npm run type:check
```

> 注意：本项目基于飞书妙搭（Miaoda）平台开发，使用了 `@lark-apaas/*` 平台SDK。
> 本地运行需要配置相应的平台环境变量和PostgreSQL数据库。

## 目录结构

```
.
├── client/                 # 前端源码
│   ├── public/            # 静态资源
│   └── src/
│       ├── api/           # API请求层
│       ├── components/    # 通用组件
│       ├── hooks/         # 自定义Hooks
│       ├── lib/           # 工具库
│       ├── pages/         # 页面组件
│       ├── types/         # 类型声明
│       ├── app.tsx        # 路由配置
│       ├── index.tsx      # 入口文件
│       └── index.css      # 全局样式
├── server/                 # 后端源码
│   ├── common/            # 公共模块（过滤器、工具、常量）
│   ├── database/          # 数据库Schema
│   ├── modules/           # 业务模块
│   ├── main.ts            # 服务入口
│   └── app.module.ts      # 根模块
├── shared/                 # 前后端共享类型
│   └── api.interface.ts   # API接口定义
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

## 隐私说明

- 本项目不包含任何真实个人信息、API密钥或令牌
- 所有示例数据均为脱敏占位数据
- AI功能的API Key由用户自行配置，存储在用户自己的数据库中
