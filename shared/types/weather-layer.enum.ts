import { EnumBase } from './enum-base'

export class WeatherLayerEnum extends EnumBase {
    static readonly WEATHER     = new WeatherLayerEnum('weather', '날씨')
    static readonly TEMPERATURE = new WeatherLayerEnum('temperature', '온도')
    static readonly PM10        = new WeatherLayerEnum('pm10', '미세먼지')

    private constructor(key: string, label: string) { super(key, label) }

    get isWeather(): boolean { return this === WeatherLayerEnum.WEATHER }
    get isTemperature(): boolean { return this === WeatherLayerEnum.TEMPERATURE }
    get isPm10(): boolean { return this === WeatherLayerEnum.PM10 }

    static from(key: string): WeatherLayerEnum | undefined {
        return EnumBase.fromKey<WeatherLayerEnum>(WeatherLayerEnum, key)
    }
}
