import { WeatherRepository } from '../../domain/ports/weather-repository.port';
import { Weather } from '../../domain/entities/weather.entity';
import { NominatimService } from './nominatim.service';
import { OpenMeteoService } from './open-meteo.service';
import { ExternalAPIError } from '@api/domain/errors/external-api.error';

export class ExternalWeatherRepository implements WeatherRepository {
  constructor(
    private readonly nominatim: NominatimService,
    private readonly meteo: OpenMeteoService,
  ) {}

  async getWeatherByCity(city: string): Promise<Weather> {
    try {
      const { lat, lon } = await this.nominatim.getCoordinates(city);
      const weatherData = await this.meteo.getCurrentWeather(lat, lon);

      return new Weather(
        weatherData.temperature,
        weatherData.windSpeed,
        weatherData.windDirection,
      );
    } catch {
      throw new ExternalAPIError();
    }
  }
}
