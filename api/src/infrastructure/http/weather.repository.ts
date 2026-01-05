import { WeatherRepository } from '../../domain/ports/weather-repository.port';
import { Weather } from '../../domain/entities/weather.entity';
import { NominatimService } from './nominatim.service';
import { OpenMeteoService } from './open-meteo.service';
import { ExternalAPIError } from '@api/domain/errors/external-api.error';
import { City } from '../entities/city.entity';

export class ExternalWeatherRepository implements WeatherRepository {
  constructor(
    private readonly nominatim: NominatimService,
    private readonly meteo: OpenMeteoService,
  ) {}

  async getWeatherByCity(cityName: string): Promise<Weather> {
    try {
      const city: City = await this.nominatim.getCoordinates(cityName);
      const weatherData = await this.meteo.getCurrentWeather(city);

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
