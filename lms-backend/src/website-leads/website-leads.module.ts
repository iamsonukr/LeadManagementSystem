import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsiteLeadsController } from './website-leads.controller';
import { WebsiteLeadsService } from './website-leads.service';
import { WebsiteSource, WebsiteSourceSchema } from './website-source.entity';
import { Lead, LeadSchema } from '../leads/leads.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebsiteSource.name, schema: WebsiteSourceSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [WebsiteLeadsController],
  providers: [WebsiteLeadsService],
  exports: [WebsiteLeadsService],
})
export class WebsiteLeadsModule {}
