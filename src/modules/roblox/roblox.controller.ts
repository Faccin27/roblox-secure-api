import {
  Controller,
  Post,
  Body,
  Ip,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { HmacGuard } from '../../common/guards/hmac.guard';

import { WebhookService } from '../webhook/webhook.service';
import axios, { AxiosError } from 'axios';
import { ValidatePlayerDto } from './dto/validate-player.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller('roblox')
export class RobloxController {
  constructor(private readonly webhook: WebhookService) {}

  @UseGuards(HmacGuard)
  @Post('validate-player')
  async validatePlayer(@Body() body: ValidatePlayerDto, @Ip() ip: string) {
    if (process.env.NODE_ENV === 'production') {
      const userId = await this.resolveUserId(body.username);
      if (!userId) {
        throw new BadRequestException('username_not_found');
      }

      const verifyPresenceEnv = process.env.ROBLOX_VERIFY_PRESENCE;
      const shouldCheckPresence =
        verifyPresenceEnv === 'true'
          ? true
          : verifyPresenceEnv === 'false'
            ? false
            : !!process.env.ROBLOX_COOKIE;

      if (shouldCheckPresence) {
        if (!process.env.ROBLOX_COOKIE) {
          throw new BadRequestException('missing_roblox_cookie');
        }
        const online = await this.checkPresence(userId);
        if (!online) {
          throw new UnauthorizedException('player_not_online');
        }
      }
    }

    await this.webhook.sendAction({
      keyName: body.keyName,
      ip,
      timestamp: Date.now(),
      username: body.username,
    });

    const scriptPath = path.join(process.cwd(), 'scripts', 'validated.lua');
    const template = fs.readFileSync(scriptPath, 'utf8');
    const lua = template
      .replace('{{USERNAME}}', body.username)
      .replace('{{KEY_NAME}}', body.keyName);

    return { ok: true, script: lua };
  }

  private async resolveUserId(username: string): Promise<number | null> {
    const url = 'https://users.roblox.com/v1/usernames/users';
    const payload: { usernames: string[]; excludeBannedUsers: boolean } = {
      usernames: [username],
      excludeBannedUsers: true,
    };
    const res = await axios.post<UserLookupResponse>(url, payload);
    const item = res.data.data?.[0];
    return item?.id ?? null;
  }

  private async checkPresence(userId: number): Promise<boolean> {
    const cookie = process.env.ROBLOX_COOKIE as string;
    const url = 'https://presence.roblox.com/v1/presence/users';
    const body: { userIds: number[] } = { userIds: [userId] };

    let token: string | undefined;
    try {
      await axios.post(url, body, {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
      });
    } catch (err) {
      const e = err as AxiosError;
      token =
        (e.response?.headers?.['x-csrf-token'] as string | undefined) ??
        undefined;
    }

    const res = await axios.post<PresenceResponse>(url, body, {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        'x-csrf-token': token ?? '',
      },
    });
    const presences = res.data.userPresences ?? [];
    const entry = presences.find((p) => p.userId === userId);
    return !!entry && entry.userPresenceType !== 0;
  }
}

type UserLookupItem = { id: number; name: string; displayName?: string };
type UserLookupResponse = { data: UserLookupItem[] };
type PresenceResponse = {
  userPresences: Array<{ userId: number; userPresenceType: number }>;
};
