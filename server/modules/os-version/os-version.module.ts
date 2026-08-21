import { Module } from '@nestjs/common';
import { OsVersionController } from './os-version.controller';
import { OsVersionService } from './os-version.service';

@Module({
  controllers: [OsVersionController],
  providers: [OsVersionService],
  exports: [OsVersionService],
})
export class OsVersionModule {}
