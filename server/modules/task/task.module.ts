import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { DailySettingController } from './daily-setting.controller';
import { DailySettingService } from './daily-setting.service';
import { DailyRecommendationService } from './daily-recommendation.service';

@Module({
  controllers: [TaskController, DailySettingController],
  providers: [TaskService, DailySettingService, DailyRecommendationService],
  exports: [TaskService, DailyRecommendationService],
})
export class TaskModule {}
