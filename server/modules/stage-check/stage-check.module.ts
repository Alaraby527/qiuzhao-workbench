import { Module } from '@nestjs/common';
import { StageCheckController } from './stage-check.controller';
import { StageCheckService } from './stage-check.service';

@Module({
  controllers: [StageCheckController],
  providers: [StageCheckService],
  exports: [StageCheckService],
})
export class StageCheckModule {}
