import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RobloxModule } from './modules/roblox/roblox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RobloxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
