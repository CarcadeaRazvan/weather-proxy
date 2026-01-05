import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';

import { GetWeatherUseCase } from '@api/application/use-cases/get-weather.usecase';

@Controller()
export class WeatherController {
  constructor(private readonly getWeather: GetWeatherUseCase) {}

  @Get('weather')
  async getWeatherByCity(
    @Query('city') city?: string,
    @Headers('user_id') userId?: string,
  ) {
    if (!city) {
      throw new BadRequestException('city query parameter is required');
    }

    if (!userId) {
      throw new BadRequestException('USER_ID header is required');
    }

    return this.getWeather.execute(city, userId);
  }
}
