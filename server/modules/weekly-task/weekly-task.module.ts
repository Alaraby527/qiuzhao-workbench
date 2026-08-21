import { Module } from '@nestjs/common';
import { WeeklyTaskController } from './weekly-task.controller';
import { WeeklyTaskService } from './weekly-task.service';

@Module({
  controllers: [WeeklyTaskController],
  providers: [WeeklyTaskService],
  exports: [WeeklyTaskService],
})
export class WeeklyTaskModule {}
