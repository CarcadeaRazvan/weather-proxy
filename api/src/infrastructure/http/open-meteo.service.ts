import axios from 'axios';

type OpenMeteoResponse = {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
  };
};

export class OpenMeteoService {
  async getCurrentWeather(
    lat: number,
    lon: number,
  ): Promise<{
    temperature: number;
    windSpeed: number;
    windDirection: number;
  }> {
    const response = await axios.get<OpenMeteoResponse>(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: lat,
          longitude: lon,
          current_weather: true,
        },
      },
    );

    const current = response.data.current_weather;

    if (!current) {
      throw new Error('Weather data not available');
    }

    return {
      temperature: current.temperature,
      windSpeed: current.windspeed,
      windDirection: current.winddirection,
    };
  }
}
