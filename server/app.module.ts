import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { ApplicationModule } from './modules/application/application.module';
import { TaskModule } from './modules/task/task.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { ReviewModule } from './modules/review/review.module';
import { TrainingModule } from './modules/training/training.module';
import { ResumeModule } from './modules/resume/resume.module';
import { StageCheckModule } from './modules/stage-check/stage-check.module';
import { RhythmModule } from './modules/rhythm/rhythm.module';
import { MiniSystemModule } from './modules/mini-system/mini-system.module';
import { OsVersionModule } from './modules/os-version/os-version.module';
import { ScrapNoteModule } from './modules/scrap-note/scrap-note.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AiModule } from './modules/ai/ai.module';
import { MonthlyGoalModule } from './modules/monthly-goal/monthly-goal.module';
import { WeeklyTaskModule } from './modules/weekly-task/weekly-task.module';
import { BacklogModule } from './modules/backlog/backlog.module';
import { PreparationModule } from './modules/preparation/preparation.module';
import { JobListingModule } from './modules/job-listing/job-listing.module';
import { BossGreetingModule } from './modules/boss-greeting/boss-greeting.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    ApplicationModule,
    TaskModule,
    CheckInModule,
    ReviewModule,
    TrainingModule,
    ResumeModule,
    StageCheckModule,
    RhythmModule,
    MiniSystemModule,
    OsVersionModule,
    ScrapNoteModule,
    DashboardModule,
    AiModule,
    MonthlyGoalModule,
    WeeklyTaskModule,
    BacklogModule,
    PreparationModule,
    JobListingModule,
    BossGreetingModule,
    ViewModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
