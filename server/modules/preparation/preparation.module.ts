import { Module } from '@nestjs/common';
import { PreparationController } from './preparation.controller';
import { PreparationService } from './preparation.service';

@Module({
  controllers: [PreparationController],
  providers: [PreparationService],
  exports: [PreparationService],
})
export class PreparationModule {}
