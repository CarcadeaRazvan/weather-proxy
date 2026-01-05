import Redis from 'ioredis';

export function createRedisClient(): Redis {
  const host = process.env.REDIS_HOST || 'redis';
  const port = Number(process.env.REDIS_PORT || 6379);

  const redis = new Redis({
    host,
    port,
    lazyConnect: false,
    maxRetriesPerRequest: null,
  });

  redis.on('connect', () => {
    console.log(`Connected to Redis at ${host}:${port}`);
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  return redis;
}
