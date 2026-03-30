type MeasureTab = 'distance' | 'area' | 'height' | 'radius'

interface ConvertedValue {
  value: number
  label: string
}

export const useMeasure = () => {
  const measureState = useState('map:measureState', () => ({
    distance: 0,
    area: 0,
    height: 0,
    radius: 0
  }))

  const activeTab = useState<MeasureTab>('map:measureTab', () => 'distance')
  const distanceUnit = ref('m')
  const areaUnit = ref('m2')
  const heightUnit = ref('m')
  const radiusUnit = ref('m')

  function convertDistance(meters: number, unit: string): ConvertedValue {
    const map: Record<string, ConvertedValue> = {
      m: { value: meters, label: '미터' },
      km: { value: meters / 1000, label: '킬로미터' },
      ft: { value: meters * 3.28084, label: '피트' },
      yd: { value: meters * 1.09361, label: '야드' },
      nm: { value: meters / 1852, label: '해리' }
    }
    return map[unit] ?? map.m!
  }

  function convertArea(sqm: number, unit: string): ConvertedValue {
    const map: Record<string, ConvertedValue> = {
      m2: { value: sqm, label: '제곱미터' },
      km2: { value: sqm / 1_000_000, label: '제곱킬로미터' },
      ha: { value: sqm / 10_000, label: '헥타르' },
      ac: { value: sqm / 4046.86, label: '에이커' },
      ft2: { value: sqm * 10.7639, label: '제곱피트' },
      yd2: { value: sqm * 1.19599, label: '제곱야드' }
    }
    return map[unit] ?? map.m2!
  }

  const distanceDisplay = computed(() =>
    convertDistance(measureState.value.distance, distanceUnit.value)
  )
  const areaDisplay = computed(() => convertArea(measureState.value.area, areaUnit.value))
  const heightDisplay = computed(() =>
    convertDistance(measureState.value.height, heightUnit.value)
  )
  const radiusDisplay = computed(() =>
    convertDistance(measureState.value.radius, radiusUnit.value)
  )

  function clearMeasure() {
    const entities = window.viewer.entities.values
    for (let i = entities.length - 1; i >= 0; i--) {
      if (String(entities[i].id).startsWith('measure-')) window.viewer.entities.remove(entities[i])
    }
    try {
      window.viewer._cancelDrawAction?.()
    } catch {}
    measureState.value = { distance: 0, area: 0, height: 0, radius: 0 }
  }

  function drawDistance() {
    clearMeasure()
    window.viewer._drawAction({ shapeType: 1, applyTo: 2, stopDrawAction: 3 }).then((res: any) => {
      const positions = res.data.positions
      if (!positions || positions.length < 2) return
      const cartoPts = positions.map((p: any) =>
        window.Cesium.Ellipsoid.WGS84.cartesianToCartographic(p)
      )
      let dist = 0
      for (let i = 0; i < cartoPts.length - 1; i++) {
        dist += new window.Cesium.EllipsoidGeodesic(cartoPts[i], cartoPts[i + 1]).surfaceDistance
      }
      measureState.value.distance = dist
      window.viewer.entities.add({
        id: `measure-distance-${Date.now()}`,
        polyline: {
          positions,
          width: 10,
          clampToGround: true,
          material: new window.Cesium.PolylineGlowMaterialProperty({
            color: window.Cesium.Color.YELLOW
          })
        }
      })
    })
  }

  function drawArea() {
    clearMeasure()
    window.viewer._drawAction({ shapeType: 2, applyTo: 2, stopDrawAction: 3 }).then((res: any) => {
      const { positions, area } = res.data
      measureState.value.area = area
      const id = `measure-area-${Date.now()}`
      window.viewer.entities.add({
        id,
        polygon: {
          clampToGround: true,
          hierarchy: new window.Cesium.PolygonHierarchy(positions),
          material: window.Cesium.Color.YELLOW.withAlpha(0.3)
        }
      })
      window.viewer.entities.add({
        id: `${id}-outline`,
        polyline: {
          positions: [...positions, positions[0]],
          width: 2,
          clampToGround: true,
          material: window.Cesium.Color.YELLOW
        }
      })
    })
  }

  function drawHeight() {
    clearMeasure()
    window.viewer
      ._drawAction({ shapeType: 0, applyTo: 2, stopDrawAction: 7, once: true })
      .then((res: any) => {
        const carto = window.Cesium.Ellipsoid.WGS84.cartesianToCartographic(res.data.positions[0])
        const h = res.data.heights[0]
        measureState.value.height = h
        window.viewer.entities.add({
          id: `measure-height-${Date.now()}`,
          polyline: {
            positions: [
              window.Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 0),
              window.Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, h)
            ],
            width: 10,
            material: new window.Cesium.PolylineGlowMaterialProperty({
              color: window.Cesium.Color.RED
            }),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
      })
  }

  function drawRadius() {
    clearMeasure()
    window.viewer
      ._drawAction({ shapeType: 1, applyTo: 2, stopDrawAction: 7, once: true })
      .then((res: any) => {
        const positions = res.data.positions
        if (!positions || positions.length < 2) return
        const [first, second] = positions.map((p: any) =>
          window.Cesium.Ellipsoid.WGS84.cartesianToCartographic(p)
        )
        const radius = new window.Cesium.EllipsoidGeodesic(first, second).surfaceDistance
        measureState.value.radius = radius
        const center = window.Cesium.Cartesian3.fromRadians(
          first.longitude,
          first.latitude,
          first.height
        )
        window.viewer.entities.add({
          id: `measure-radius-${Date.now()}`,
          position: center,
          ellipse: {
            semiMajorAxis: radius,
            semiMinorAxis: radius,
            material: window.Cesium.Color.CYAN.withAlpha(0.3),
            outline: true,
            outlineColor: window.Cesium.Color.CYAN,
            heightReference: window.Cesium.HeightReference.CLAMP_TO_GROUND,
            classificationType: window.Cesium.ClassificationType.BOTH
          },
          polyline: {
            positions,
            width: 5,
            clampToGround: true,
            material: new window.Cesium.PolylineGlowMaterialProperty({
              color: window.Cesium.Color.CYAN
            })
          }
        })
      })
  }

  return {
    measureState,
    activeTab,
    distanceUnit,
    areaUnit,
    heightUnit,
    radiusUnit,
    distanceDisplay,
    areaDisplay,
    heightDisplay,
    radiusDisplay,
    clearMeasure,
    drawDistance,
    drawArea,
    drawHeight,
    drawRadius
  }
}