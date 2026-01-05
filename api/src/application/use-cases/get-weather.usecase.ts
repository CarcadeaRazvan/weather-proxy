import { Weather } from '@api/domain/entities/weather.entity';
import { WeatherRepository } from '@api/domain/ports/weather-repository.port';
import { CachePort } from '@api/domain/ports/cache.port';
import { RateLimitPort } from '@api/domain/ports/rate-limit.port';
import { CacheData } from '../entities/cache-data.entity';

export class GetWeatherUseCase {
  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly cache: CachePort,
    private readonly rateLimit: RateLimitPort,
  ) {}

  async execute(data: CacheData): Promise<Weather> {
    await this.rateLimit.check(data.userId);

    const cacheKey = `weather:${data.city.toLowerCase()}`;

    const cached = await this.cache.get<Weather>(cacheKey);
    if (cached) {
      return cached;
    }

    const weather = await this.weatherRepository.getWeatherByCity(data.city);

    await this.cache.set(cacheKey, weather, 60);

    return weather;
  }
}
