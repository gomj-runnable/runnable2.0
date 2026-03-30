/**
 * 지도 페이지 내 컴포넌트 간 공유 상태
 *
 * useState를 사용해 page ↔ Toolbox ↔ Slider 간
 * prop drilling 없이 상태를 공유합니다.
 */
export const useMapInteraction = () => {
  /** 현재 열린 모달 */
  const activeModal = useState<'measure' | 'damage' | 'feature' | null>(
    'map:activeModal',
    () => null
  )

  /** 속성정보 모달 데이터 */
  const featureInfo = useState<Record<string, any> | null>('map:featureInfo', () => null)

  /** 손상정보 모달 데이터 */
  const damagedFacilities = useState<any[]>('map:damagedFacilities', () => [])

  /** 하단 슬라이더 이미지 목록 (빈 배열이면 슬라이더 닫힘) */
  const sliderImages = useState<{ src: string; label: string }[]>('map:sliderImages', () => [])

  return { activeModal, featureInfo, damagedFacilities, sliderImages }
}
