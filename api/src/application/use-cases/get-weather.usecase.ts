import { Weather } from '@api/domain/entities/weather.entity';
import { WeatherRepository } from '@api/domain/ports/weather-repository.port';
import { CachePort } from '@api/domain/ports/cache.port';
import { RateLimitPort } from '@api/domain/ports/rate-limit.port';

export class GetWeatherUseCase {
  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly cache: CachePort,
    private readonly rateLimit: RateLimitPort,
  ) {}

  async execute(city: string, userId: string): Promise<Weather> {
    await this.rateLimit.check(userId);

    const cacheKey = `weather:${city.toLowerCase()}`;

    const cached = await this.cache.get<Weather>(cacheKey);
    if (cached) {
      return cached;
    }

    const weather = await this.weatherRepository.getWeatherByCity(city);

    await this.cache.set(cacheKey, weather, 60);

    return weather;
  }
}
