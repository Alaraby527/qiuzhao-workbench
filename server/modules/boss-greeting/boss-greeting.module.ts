import { Module } from '@nestjs/common';
import { BossDailyStatsController } from './boss-daily-stats.controller';
import { BossDailyStatsService } from './boss-daily-stats.service';

@Module({
  controllers: [BossDailyStatsController],
  providers: [BossDailyStatsService],
  exports: [BossDailyStatsService],
})
export class BossGreetingModule {}
