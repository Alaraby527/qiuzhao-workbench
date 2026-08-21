import { Module } from '@nestjs/common';
import { MiniSystemController } from './mini-system.controller';
import { MiniSystemService } from './mini-system.service';

@Module({
  controllers: [MiniSystemController],
  providers: [MiniSystemService],
  exports: [MiniSystemService],
})
export class MiniSystemModule {}
