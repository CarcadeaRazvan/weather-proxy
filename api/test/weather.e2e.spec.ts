import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';

import { AppModule } from '../src/app.module';
import { NominatimService } from '@api/infrastructure/http/nominatim.service';
import { OpenMeteoService } from '@api/infrastructure/http/open-meteo.service';

import { GlobalErrorFilter } from '@api/interfaces/http/global-exception.filter';
import { ResponseInterceptor } from '@api/interfaces/http/response.interceptor';

describe('Weather API (integration)', () => {
  let app: INestApplication;
  let openMeteo: OpenMeteoService;
  let redis: Redis;
  let appRedis: Redis;

  beforeEach(async () => {
    await redis.flushall();
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    redis = new Redis({ host: process.env.REDIS_HOST ?? 'localhost' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NominatimService)
      .useValue({
        getCoordinates: jest.fn().mockResolvedValue({
          lat: 51.5074,
          lon: -0.1278,
        }),
      })
      .overrideProvider(OpenMeteoService)
      .useValue({
        getCurrentWeather: jest.fn().mockResolvedValue({
          temperature: 10,
          windSpeed: 5,
          windDirection: 180,
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new GlobalErrorFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    openMeteo = moduleRef.get(OpenMeteoService);
    appRedis = moduleRef.get(Redis);
  });

  afterAll(async () => {
    await redis.quit();
    await appRedis.quit();
    await app.close();
  });

  it('rate limits a single user after 5 requests', async () => {
    const agent = request(app.getHttpServer());

    for (let i = 0; i < 5; i++) {
      await agent
        .get('/weather?city=London')
        .set('USER_ID', 'user1')
        .expect(200);
    }

    const res = await agent
      .get('/weather?city=London')
      .set('USER_ID', 'user1')
      .expect(429);

    expect(res.body.status).toBe('error');
  });

  it('caches weather for the same user and city', async () => {
    const agent = request(app.getHttpServer());

    await agent
      .get('/weather?city=Paris')
      .set('USER_ID', 'user1')
      .expect(200);

    await agent
      .get('/weather?city=Paris')
      .set('USER_ID', 'user1')
      .expect(200);

    expect(openMeteo.getCurrentWeather).toHaveBeenCalledTimes(1);
  });

  it('does not cache across different cities', async () => {
    const agent = request(app.getHttpServer());

    const cities = ['London', 'Paris', 'Berlin', 'Rome', 'Madrid'];

    for (const city of cities) {
      await agent
        .get(`/weather?city=${city}`)
        .set('USER_ID', 'user1')
        .expect(200);
    }

    expect(openMeteo.getCurrentWeather).toHaveBeenCalledTimes(5);
  });

  it('shares cached city data across multiple users', async () => {
    const agent = request(app.getHttpServer());

    await agent
      .get('/weather?city=Tokyo')
      .set('USER_ID', 'user1')
      .expect(200);

    await agent
      .get('/weather?city=Tokyo')
      .set('USER_ID', 'user2')
      .expect(200);

    expect(openMeteo.getCurrentWeather).toHaveBeenCalledTimes(1);
  });

  it('check non-cached city data across multiple users', async () => {
    const agent = request(app.getHttpServer());

    await agent
      .get('/weather?city=Tokyo')
      .set('USER_ID', 'user1')
      .expect(200);

    await agent
      .get('/weather?city=London')
      .set('USER_ID', 'user2')
      .expect(200);

    expect(openMeteo.getCurrentWeather).toHaveBeenCalledTimes(2);
  });

  it('handles concurrent users correctly', async () => {
    const agent = request(app.getHttpServer());

    const requests = Array.from({ length: 5 }).map((_, i) =>
      agent
        .get('/weather?city=Sydney')
        .set('USER_ID', `user${i}`)
    );

    await Promise.all(requests);

    expect(openMeteo.getCurrentWeather).toHaveBeenCalled();
  });
});
