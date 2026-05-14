import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleAdsController } from './google-ads.controller';
import { GoogleAdsService } from './google-ads.service';
import {
  GoogleAdsCampaign,
  GoogleAdsCampaignSchema,
} from './google-ads-campaign.entity';
import { Lead, LeadSchema } from '../leads/leads.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: GoogleAdsCampaign.name, schema: GoogleAdsCampaignSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [GoogleAdsController],
  providers: [GoogleAdsService],
  exports: [GoogleAdsService],
})
export class GoogleAdsModule {}