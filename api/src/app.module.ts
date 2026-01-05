import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import Redis from 'ioredis';
import { createRedisClient } from '@api/infrastructure/cache/redis.client';

import { WeatherController } from '@api/interfaces/http/weather.controller';
import { GetWeatherUseCase } from '@api/application/use-cases/get-weather.usecase';

import { RedisCacheAdapter } from '@api/infrastructure/cache/redis-cache.adapter';
import { ExternalWeatherRepository } from '@api/infrastructure/http/weather.repository';
import { NominatimService } from '@api/infrastructure/http/nominatim.service';
import { OpenMeteoService } from '@api/infrastructure/http/open-meteo.service';

import { RedisRateLimitAdapter } from '@api/infrastructure/rate-limit/redis-rate-limit.adapter';
import { ResponseInterceptor } from '@api/interfaces/http/response.interceptor';
import { GlobalErrorFilter } from './interfaces/http/global-exception.filter';

export @Module({
  controllers: [WeatherController],
  providers: [
    {
      provide: Redis,
      useFactory: () => createRedisClient(),
    },

    NominatimService,
    OpenMeteoService,

    {
      provide: 'WeatherRepository',
      useFactory: (nominatim: NominatimService, meteo: OpenMeteoService) =>
        new ExternalWeatherRepository(nominatim, meteo),
      inject: [NominatimService, OpenMeteoService],
    },

    {
      provide: 'CachePort',
      useFactory: (redis: Redis) => new RedisCacheAdapter(redis),
      inject: [Redis],
    },

    {
      provide: GetWeatherUseCase,
      useFactory: (repo, cache, rateLimit) =>
        new GetWeatherUseCase(repo, cache, rateLimit),
      inject: ['WeatherRepository', 'CachePort', 'RateLimitPort'],
    },

    {
      provide: 'RateLimitPort',
      useFactory: (redis: Redis) => new RedisRateLimitAdapter(redis),
      inject: [Redis],
    },
  ],
})

class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalErrorFilter());

  return app;
}
