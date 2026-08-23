export interface CurrentWeather {
  temperature: number;
  apparentTemperature?: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  windSpeed: number;
  humidity?: number;
  time: string;
}

export interface WeatherForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  condition: string;
}

export interface WeatherData {
  city: string;
  current: CurrentWeather;
  forecast?: WeatherForecastDay[];
  lastUpdated: number;
}
