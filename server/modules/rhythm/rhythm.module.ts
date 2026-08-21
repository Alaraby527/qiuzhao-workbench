import { Module } from '@nestjs/common';
import { RhythmController } from './rhythm.controller';
import { RhythmService } from './rhythm.service';

@Module({
  controllers: [RhythmController],
  providers: [RhythmService],
  exports: [RhythmService],
})
export class RhythmModule {}
