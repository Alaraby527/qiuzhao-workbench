import { Module } from '@nestjs/common';
import { JobListingController } from './job-listing.controller';
import { JobListingService } from './job-listing.service';
import { MatchScoreService } from './match-score.service';

@Module({
  controllers: [JobListingController],
  providers: [JobListingService, MatchScoreService],
  exports: [JobListingService, MatchScoreService],
})
export class JobListingModule {}
