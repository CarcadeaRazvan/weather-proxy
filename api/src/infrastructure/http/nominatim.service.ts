import axios from 'axios';
import { City } from '../entities/city.entity';

type NominatimResponse = {
  lat: string;
  lon: string;
};

export class NominatimService {
  async getCoordinates(city: string): Promise<City> {
    const response = await axios.get<NominatimResponse[]>(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: city,
          format: 'json',
        },
        headers: {
          'User-Agent': 'weather-proxy-challenge',
        },
      },
    );

    if (!response.data.length) {
      throw new Error(`City not found: ${city}`);
    }

    return new City(
      Number(response.data[0].lat),
      Number(response.data[0].lon)
    );
  }
}
