import { EnumBase } from './enum-base'
import type { HourlyWeather } from './weather'
import { WeatherConditionEnum } from './weather-condition.enum'
import { Pm10GradeEnum } from './pm10-grade.enum'

type ColorResolver = (weather: HourlyWeather) => string

const NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'

/**
 * 평균 기온을 온도 단계별 그라데이션 색상으로 변환한다.
 * -10°C(파랑)에서 40°C(빨강)까지 색상 정지점을 선형 보간한다.
 *
 * @param tempAvg - 평균 기온 (°C). -10~40 범위 외에는 경계값으로 클램프된다.
 * @returns 반투명 RGBA 색상 문자열
 */
export const tempToColor = (tempAvg: number): string => {
    const clamped = Math.max(-10, Math.min(40, tempAvg))
    type TempColorStop = { t: number; rgb: [number, number, number] }
    const stops = [
        { t: -10, rgb: [48, 118, 255] },
        { t: 0, rgb: [57, 196, 255] },
        { t: 15, rgb: [122, 214, 102] },
        { t: 25, rgb: [247, 203, 69] },
        { t: 40, rgb: [230, 90, 58] }
    ] satisfies TempColorStop[]

    let left: TempColorStop = stops[0] ?? { t: -10, rgb: [48, 118, 255] }
    let right: TempColorStop = stops[stops.length - 1] ?? { t: 40, rgb: [230, 90, 58] }
    for (let index = 0; index < stops.length - 1; index += 1) {
        const current = stops[index]
        const next = stops[index + 1]
        if (!current || !next) continue
        if (clamped >= current.t && clamped <= next.t) {
            left = current
            right = next
            break
        }
    }

    const span = Math.max(right.t - left.t, 1)
    const ratio = (clamped - left.t) / span
    const r = Math.round(left.rgb[0] + (right.rgb[0] - left.rgb[0]) * ratio)
    const g = Math.round(left.rgb[1] + (right.rgb[1] - left.rgb[1]) * ratio)
    const b = Math.round(left.rgb[2] + (right.rgb[2] - left.rgb[2]) * ratio)
    return `rgba(${r}, ${g}, ${b}, 0.2)`
}

export class WeatherLayerEnum extends EnumBase {
    static readonly WEATHER = new WeatherLayerEnum(
        'weather',
        '예보',
        (w) => WeatherConditionEnum.from(w.condition).color
    )
    static readonly TEMPERATURE = new WeatherLayerEnum('temperature', '온도', (w) =>
        tempToColor(w.temperature)
    )
    static readonly PM10 = new WeatherLayerEnum('pm10', '미세먼지', (w) => {
        const pm10G = w.pm10Grade ? Pm10GradeEnum.from(w.pm10Grade) : null
        const pm25G = w.pm25Grade ? Pm10GradeEnum.from(w.pm25Grade) : null
        const composite = Pm10GradeEnum.composite(pm10G, pm25G)
        return composite ? composite.color : NO_DATA_COLOR
    })

    private constructor(
        key: string,
        label: string,
        private readonly colorResolver: ColorResolver
    ) {
        super(key, label)
    }

    /** 이 레이어의 색상 전략에 따라 날씨 데이터를 색상으로 변환한다. */
    resolveColor(weather: HourlyWeather): string {
        return this.colorResolver(weather)
    }

    get isWeather(): boolean {
        return this.key === 'weather'
    }
    get isTemperature(): boolean {
        return this.key === 'temperature'
    }
    get isPm10(): boolean {
        return this.key === 'pm10'
    }

    static from(key: string): WeatherLayerEnum | undefined {
        return EnumBase.fromKey<WeatherLayerEnum>(WeatherLayerEnum, key)
    }
}
