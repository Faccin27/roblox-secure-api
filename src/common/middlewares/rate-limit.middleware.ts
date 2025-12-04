import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const requests = new Map<string, { count: number; reset: number }>();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  limit = 30; // per minute
  windowMs = 60 * 1000;

  use(req: Request, res: Response, next: NextFunction) {
    const ip = (req.ip as string) || (req.connection.remoteAddress as string);
    const now = Date.now();
    const entry = requests.get(ip);

    if (!entry || now > entry.reset) {
      requests.set(ip, { count: 1, reset: now + this.windowMs });
      return next();
    }

    if (entry.count >= this.limit) {
      res.status(429).json({ ok: false, message: 'rate limit exceeded' });
      return;
    }
    entry.count++;
    next();
  }
}
