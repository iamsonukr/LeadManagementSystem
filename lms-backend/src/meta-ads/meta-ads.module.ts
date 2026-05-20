import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetaAdsController } from './meta-ads.controller';
import { MetaAdsService } from './meta-ads.service';
import {
  MetaAdsCampaign,
  MetaAdsCampaignSchema,
} from './meta-ads-campaign.entity';
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
