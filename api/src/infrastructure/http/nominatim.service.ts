import axios from 'axios';

type NominatimResponse = {
  lat: string;
  lon: string;
};

export class NominatimService {
  async getCoordinates(city: string): Promise<{ lat: number; lon: number }> {
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

    return {
      lat: Number(response.data[0].lat),
      lon: Number(response.data[0].lon),
    };
  }
}
