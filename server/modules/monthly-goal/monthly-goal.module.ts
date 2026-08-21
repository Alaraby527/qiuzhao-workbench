import { Module } from '@nestjs/common';
import { MonthlyGoalController } from './monthly-goal.controller';
import { MonthlyGoalService } from './monthly-goal.service';

@Module({
  controllers: [MonthlyGoalController],
  providers: [MonthlyGoalService],
  exports: [MonthlyGoalService],
})
export class MonthlyGoalModule {}
