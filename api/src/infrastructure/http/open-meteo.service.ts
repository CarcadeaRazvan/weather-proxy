import axios from 'axios';
import { City } from '../entities/city.entity';
import { WeatherDTO } from '../entities/weatherDTO.entity';

type OpenMeteoResponse = {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
  };
};

export class OpenMeteoService {
  async getCurrentWeather(
    city: City
  ): Promise<WeatherDTO> {
    const response = await axios.get<OpenMeteoResponse>(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: city.lat,
          longitude: city.lon,
          current_weather: true,
        },
      },
    );

    const current = response.data.current_weather;

    if (!current) {
      throw new Error('Weather data not available');
    }

    return new WeatherDTO(
      current.temperature,
      current.windspeed,
      current.winddirection,
    );
  }
}
