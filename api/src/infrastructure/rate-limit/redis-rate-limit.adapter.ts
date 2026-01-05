import Redis from 'ioredis';
import { RateLimitPort } from '@api/domain/ports/rate-limit.port';
import { RateLimitExceededError } from '@api/domain/errors/rate-limit.error';

export class RedisRateLimitAdapter implements RateLimitPort {
  private readonly LIMIT = 5;
  private readonly WINDOW_SECONDS = 60;

  constructor(private readonly redis: Redis) {}

  async check(userId: string): Promise<void> {
    const key = `rate:${userId}`;

    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, this.WINDOW_SECONDS);
    }

    if (count > this.LIMIT) {
      throw new RateLimitExceededError();
    }
  }
}
