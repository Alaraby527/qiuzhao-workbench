import { Module } from '@nestjs/common';
import { ScrapNoteController } from './scrap-note.controller';
import { ScrapNoteService } from './scrap-note.service';

@Module({
  controllers: [ScrapNoteController],
  providers: [ScrapNoteService],
  exports: [ScrapNoteService],
})
export class ScrapNoteModule {}
