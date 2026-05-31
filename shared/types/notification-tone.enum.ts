// 알림 톤(성공/오류/정보/경고) enum — 색상·아이콘 포함
import { EnumBase } from './enum-base'

export class NotificationToneEnum extends EnumBase {
    static readonly SUCCESS = new NotificationToneEnum(
        'success',
        '성공',
        'green',
        'i-lucide-check-circle'
    )
    static readonly ERROR = new NotificationToneEnum('error', '오류', 'red', 'i-lucide-x-circle')
    static readonly INFO = new NotificationToneEnum('info', '정보', 'blue', 'i-lucide-info')
    static readonly WARNING = new NotificationToneEnum(
        'warning',
        '경고',
        'orange',
        'i-lucide-alert-triangle'
    )

    private constructor(
        key: string,
        label: string,
        public readonly color: string,
        public readonly icon: string
    ) {
        super(key, label)
    }

    get isSuccess(): boolean {
        return this.key === 'success'
    }
    get isError(): boolean {
        return this.key === 'error'
    }
    get isInfo(): boolean {
        return this.key === 'info'
    }
    get isWarning(): boolean {
        return this.key === 'warning'
    }

    static from(key: string): NotificationToneEnum {
        return (
            EnumBase.fromKey<NotificationToneEnum>(NotificationToneEnum, key) ??
            NotificationToneEnum.INFO
        )
    }
}
