import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './leads.entity';
import { LeadController } from './leads.controller';
import { LeadServices } from './leads.services';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
  ],
  controllers: [LeadController],
  providers: [LeadServices],
  exports: [LeadServices],
})
export class LeadsModule {}
