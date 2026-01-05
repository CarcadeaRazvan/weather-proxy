export class WeatherDTO {
  constructor(
    public readonly temperature: number,
    public readonly windSpeed: number,
    public readonly windDirection: number,
  ) {}
}
