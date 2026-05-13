import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { DepartmentModule } from './department/department.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { FollowUpsModule } from './followups/followups.module';
import { CallsModule } from './calls/calls.module';
import { ProjectsModule } from './projects/projects.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    UsersModule,
    DepartmentModule,
    AuthModule,
    LeadsModule,
    FollowUpsModule,
    CallsModule,
    ProjectsModule,
    DashboardModule,
    IntegrationsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
