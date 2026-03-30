<script setup lang="ts">
import { useMeasure } from '~/composables/useMeasure'

const { activeModal, featureInfo, damagedFacilities } = useMapInteraction()
const {
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
} = useMeasure()

const DAMAGE_COLS = [
  '순번',
  '기준연도',
  '점검종류',
  '손상종류',
  '손상명',
  '손상수량',
  '추출연도',
  '부재상태',
  '보수방법설명',
  'GIS정보'
]

function toggleModal(name: 'measure' | 'damage' | 'feature') {
  activeModal.value = activeModal.value === name ? null : name
}
</script>

<template>
  <!-- 툴박스 버튼 -->
  <div class="toolbox">
    <ul class="toolbox-list">
      <li class="toolbox-item">
        <button
          type="button"
          class="toolbox-btn ico-measure"
          :class="{ active: activeModal === 'measure' }"
          aria-label="측정"
          @click="toggleModal('measure')"
        />
        <span class="toolbox-tooltip">측정</span>
      </li>
      <li class="toolbox-item">
        <button
          type="button"
          class="toolbox-btn ico-layer_option"
          :class="{ active: activeModal === 'damage' }"
          aria-label="손상정보"
          @click="toggleModal('damage')"
        />
        <span class="toolbox-tooltip">손상정보</span>
      </li>
      <li class="toolbox-item">
        <button
          type="button"
          class="toolbox-btn ico-feature-info"
          :class="{ active: activeModal === 'feature' }"
          aria-label="속성정보"
          @click="toggleModal('feature')"
        />
        <span class="toolbox-tooltip">속성정보</span>
      </li>
    </ul>
  </div>

  <!-- 측정 모달 -->
  <section
    id="toolbox-measure"
    class="krds-modal type2"
    :class="{ show: activeModal === 'measure' }"
    role="dialog"
  >
    <div class="modal-dialog offset-tools w292">
      <div class="modal-content uiDrag">
        <div class="modal-header">
          <h2 class="modal-title">측정</h2>
          <button type="button" class="krds-btn icon btn-close" @click="activeModal = null">
            <span class="sr-only">닫기</span>
            <i class="icon ico-popup-close" />
          </button>
        </div>
        <div class="modal-conts">
          <div class="krds-tab-area layer">
            <div class="tab line full">
              <ul class="tab_line_list2">
                <li
                  role="tab"
                  :aria-selected="activeTab === 'distance'"
                  :class="{ active: activeTab === 'distance' }"
                  @click="activeTab = 'distance'"
                >
                  <button type="button" class="btn-tab">거리</button>
                </li>
                <li
                  role="tab"
                  :aria-selected="activeTab === 'area'"
                  :class="{ active: activeTab === 'area' }"
                  @click="activeTab = 'area'"
                >
                  <button type="button" class="btn-tab">면적</button>
                </li>
                <li
                  role="tab"
                  :aria-selected="activeTab === 'height'"
                  :class="{ active: activeTab === 'height' }"
                  @click="activeTab = 'height'"
                >
                  <button type="button" class="btn-tab">높이</button>
                </li>
                <li
                  role="tab"
                  :aria-selected="activeTab === 'radius'"
                  :class="{ active: activeTab === 'radius' }"
                  @click="activeTab = 'radius'"
                >
                  <button type="button" class="btn-tab">반경</button>
                </li>
              </ul>
            </div>
            <div class="tab-conts-wrap">
              <!-- 거리 -->
              <section
                class="tab-conts"
                :class="{ active: activeTab === 'distance' }"
                role="tabpanel"
              >
                <h3 class="sr-only">거리</h3>
                <div class="box-area type3">
                  <div class="box-inner gap-4">
                    <div class="form-wrap row">
                      <label class="label">단위선택</label>
                      <select v-model="distanceUnit" class="krds-select small full">
                        <option value="m">미터</option>
                        <option value="km">킬로미터</option>
                        <option value="ft">피트</option>
                        <option value="yd">야드</option>
                        <option value="nm">해리</option>
                      </select>
                    </div>
                    <p>두 점 이상 클릭 후 더블 클릭 시 측정이 완료됩니다.</p>
                    <div class="result full center">
                      <p class="result-tit">측정결과</p>
                      <p class="num">
                        <span class="secondary">{{ distanceDisplay.value.toFixed(2) }}</span>
                        {{ distanceDisplay.label }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="btn-wrap full mt12">
                  <button type="button" class="krds-btn primary small" @click="drawDistance">
                    그리기
                  </button>
                  <button type="button" class="krds-btn outline small" @click="clearMeasure">
                    지우기
                  </button>
                </div>
              </section>
              <!-- 면적 -->
              <section class="tab-conts" :class="{ active: activeTab === 'area' }" role="tabpanel">
                <h3 class="sr-only">면적</h3>
                <div class="box-area type3">
                  <div class="box-inner gap-4">
                    <div class="form-wrap row">
                      <label class="label">단위선택</label>
                      <select v-model="areaUnit" class="krds-select small full">
                        <option value="m2">제곱미터</option>
                        <option value="km2">제곱킬로미터</option>
                        <option value="ha">헥타르</option>
                        <option value="ac">에이커</option>
                        <option value="ft2">제곱피트</option>
                        <option value="yd2">제곱야드</option>
                      </select>
                    </div>
                    <p>세 점 이상 클릭 후 더블 클릭 시 측정이 완료됩니다.</p>
                    <div class="result full center">
                      <p class="result-tit">측정결과</p>
                      <p class="num">
                        <span class="secondary">{{ areaDisplay.value.toFixed(2) }}</span>
                        {{ areaDisplay.label }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="btn-wrap full mt12">
                  <button type="button" class="krds-btn primary small" @click="drawArea">
                    그리기
                  </button>
                  <button type="button" class="krds-btn outline small" @click="clearMeasure">
                    지우기
                  </button>
                </div>
              </section>
              <!-- 높이 -->
              <section
                class="tab-conts"
                :class="{ active: activeTab === 'height' }"
                role="tabpanel"
              >
                <h3 class="sr-only">높이</h3>
                <div class="box-area type3">
                  <div class="box-inner gap-4">
                    <div class="form-wrap row">
                      <label class="label">단위선택</label>
                      <select v-model="heightUnit" class="krds-select small full">
                        <option value="m">미터</option>
                        <option value="km">킬로미터</option>
                        <option value="ft">피트</option>
                        <option value="yd">야드</option>
                        <option value="nm">해리</option>
                      </select>
                    </div>
                    <p>한 지점 클릭 시 측정이 완료됩니다.</p>
                    <div class="result full center">
                      <p class="result-tit">측정결과</p>
                      <p class="num">
                        <span class="secondary">{{ heightDisplay.value.toFixed(2) }}</span>
                        {{ heightDisplay.label }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="btn-wrap full mt12">
                  <button type="button" class="krds-btn primary small" @click="drawHeight">
                    그리기
                  </button>
                  <button type="button" class="krds-btn outline small" @click="clearMeasure">
                    지우기
                  </button>
                </div>
              </section>
              <!-- 반경 -->
              <section
                class="tab-conts"
                :class="{ active: activeTab === 'radius' }"
                role="tabpanel"
              >
                <h3 class="sr-only">반경</h3>
                <div class="box-area type3">
                  <div class="box-inner gap-4">
                    <div class="form-wrap row">
                      <label class="label">단위선택</label>
                      <select v-model="radiusUnit" class="krds-select small full">
                        <option value="m">미터</option>
                        <option value="km">킬로미터</option>
                        <option value="ft">피트</option>
                        <option value="yd">야드</option>
                        <option value="nm">해리</option>
                      </select>
                    </div>
                    <p>두 지점 클릭 시 측정이 완료됩니다.</p>
                    <div class="result full center">
                      <p class="result-tit">측정결과</p>
                      <p class="num">
                        <span class="secondary">{{ radiusDisplay.value.toFixed(2) }}</span>
                        {{ radiusDisplay.label }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="btn-wrap full mt12">
                  <button type="button" class="krds-btn primary small" @click="drawRadius">
                    그리기
                  </button>
                  <button type="button" class="krds-btn outline small" @click="clearMeasure">
                    지우기
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 손상정보 모달 -->
  <section
    id="toolbox-damage-info"
    class="krds-modal type2"
    :class="{ show: activeModal === 'damage' }"
    role="dialog"
  >
    <div class="modal-dialog offset-tools w560">
      <div class="modal-content uiDrag">
        <div class="modal-header">
          <h2 class="modal-title">손상정보</h2>
          <button type="button" class="krds-btn icon btn-close" @click="activeModal = null">
            <span class="sr-only">닫기</span>
            <i class="icon ico-popup-close" />
          </button>
        </div>
        <div class="modal-conts">
          <div class="damage-table-wrap">
            <table class="damage-list-table">
              <thead>
                <tr>
                  <th v-for="col in DAMAGE_COLS" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in damagedFacilities" :key="i">
                  <td v-for="col in DAMAGE_COLS" :key="col">{{ item[col] ?? '-' }}</td>
                </tr>
                <tr v-if="damagedFacilities.length === 0">
                  <td :colspan="DAMAGE_COLS.length" class="empty-cell">데이터가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 속성정보 모달 -->
  <section
    id="toolbox-feature-info"
    class="krds-modal type2"
    :class="{ show: activeModal === 'feature' }"
    role="dialog"
  >
    <div class="modal-dialog offset-tools w380">
      <div class="modal-content uiDrag">
        <div class="modal-header">
          <h2 class="modal-title">속성정보 조회</h2>
          <button type="button" class="krds-btn icon btn-close" @click="activeModal = null">
            <span class="sr-only">닫기</span>
            <i class="icon ico-popup-close" />
          </button>
        </div>
        <div class="modal-conts">
          <div class="feature-info-list">
            <div
              v-for="[key, value] in Object.entries(featureInfo ?? {})"
              :key="key"
              class="feature-info-row"
            >
              <span class="feature-info-key">{{ key }}</span>
              <span class="feature-info-value">{{ value ?? '-' }}</span>
            </div>
            <div v-if="!featureInfo" class="empty-cell">데이터가 없습니다.</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
