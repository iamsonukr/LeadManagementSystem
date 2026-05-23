import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetaAdsController } from './website.controller';
import { MetaAdsService } from './website.service';
import { MetaAdsCampaign, MetaAdsCampaignSchema } from './website-leads';
import { Lead, LeadSchema } from '../leads/leads.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MetaAdsCampaign.name, schema: MetaAdsCampaignSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [MetaAdsController],
  providers: [MetaAdsService],
  exports: [MetaAdsService],
})
export class MetaAdsModule {}
