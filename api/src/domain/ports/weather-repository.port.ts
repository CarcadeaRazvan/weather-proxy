import { Weather } from '../entities/weather.entity';

export interface WeatherRepository {
  getWeatherByCity(city: string): Promise<Weather>;
}
