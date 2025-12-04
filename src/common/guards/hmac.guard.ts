import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

import { validateSignature } from '../utils/hmac';

const seen = new Map<string, number>();

@Injectable()
export class HmacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const signature = req.headers['x-signature'] as string | undefined;
    const timestamp = req.headers['x-timestamp'] as string | undefined;

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing signature headers');
    }

    const now = Date.now();
    const tsNum = Number(timestamp);
    const windowMs = Number(process.env.HMAC_WINDOW_MS ?? 60000);
    if (!Number.isFinite(tsNum)) {
      throw new BadRequestException('invalid_timestamp');
    }
    if (Math.abs(now - tsNum) > windowMs) {
      throw new UnauthorizedException('timestamp_out_of_window');
    }

    const isValid = validateSignature(
      req.body,
      process.env.ROBLOX_SECRET!,
      signature,
      timestamp,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    if (process.env.NODE_ENV === 'production') {
      const ua = req.headers['user-agent'];
      const isRobloxUA =
        !!ua && (ua.includes('Roblox') || ua.includes('RobloxStudio'));
      if (!isRobloxUA) {
        throw new UnauthorizedException('client_not_allowed');
      }
    }

    const existing = seen.get(signature);
    if (existing && existing > now) {
      throw new UnauthorizedException('signature_replay');
    }
    seen.set(signature, now + windowMs);

    const allowedCsv = process.env.ALLOWED_PLACE_IDS;
    if (allowedCsv) {
      const allowed = allowedCsv
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
      const body = req.body as { placeId?: number | string };
      const placeId = body.placeId?.toString();
      if (!placeId || !allowed.includes(placeId)) {
        throw new UnauthorizedException('place_not_allowed');
      }
    }

    return true;
  }
}
