import { Module } from '@nestjs/common';
import { RobloxController } from './roblox.controller';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [WebhookModule],
  controllers: [RobloxController],
})
export class RobloxModule {}
