import { EnumBase } from './enum-base'

/**
 * 날씨 상태 enum class.
 * 상태별 color, icon, label을 인스턴스에 공존시켜 switch 분산을 제거한다.
 */
export class WeatherConditionEnum extends EnumBase {
    static readonly CLEAR = new WeatherConditionEnum('clear', '맑음', 'rgba(255, 230, 50, 0.2)', 'i-lucide-sun')
    static readonly PARTLY_CLOUDY = new WeatherConditionEnum('partly-cloudy', '구름많음', 'rgba(200, 185, 155, 0.2)', 'i-lucide-cloud-sun')
    static readonly CLOUDY = new WeatherConditionEnum('cloudy', '흐림', 'rgba(120, 120, 160, 0.2)', 'i-lucide-cloud')
    static readonly RAINY = new WeatherConditionEnum('rainy', '비', 'rgba(60, 150, 220, 0.2)', 'i-lucide-cloud-rain')
    static readonly SNOWY = new WeatherConditionEnum('snowy', '눈', 'rgba(150, 210, 250, 0.2)', 'i-lucide-snowflake')

    private constructor(
        key: string,
        label: string,
        public readonly color: string,
        public readonly icon: string
    ) {
        super(key, label)
    }

    /** 기상청 강수형태(PTY) + 하늘상태(SKY) 코드로부터 변환 */
    static fromKmaCode(pty: number, sky: number): WeatherConditionEnum {
        if (pty === 1 || pty === 4) return WeatherConditionEnum.RAINY
        if (pty === 2 || pty === 3) return WeatherConditionEnum.SNOWY
        if (sky === 1) return WeatherConditionEnum.CLEAR
        if (sky === 3) return WeatherConditionEnum.PARTLY_CLOUDY
        return WeatherConditionEnum.CLOUDY
    }

    /** key 문자열로 인스턴스를 찾는다 */
    static from(key: string): WeatherConditionEnum {
        return EnumBase.fromKey<WeatherConditionEnum>(WeatherConditionEnum, key) ?? WeatherConditionEnum.CLOUDY
    }
}
