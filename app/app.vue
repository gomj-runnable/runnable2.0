<script setup lang="ts">
import type { Messages } from '@nuxt/ui'

const locale = defineLocale<Messages>({
    name: '한국어',
    code: 'ko',
    dir: 'ltr',
    messages: {
        alert: { close: '닫기' },
        authForm: { hidePassword: '비밀번호 숨기기', showPassword: '비밀번호 보기', submit: '제출' },
        banner: { close: '닫기' },
        calendar: { nextMonth: '다음 달', nextYear: '다음 해', prevMonth: '이전 달', prevYear: '이전 해' },
        carousel: { dots: '슬라이드 {page}', goto: '슬라이드 {page}(으)로 이동', next: '다음', prev: '이전' },
        chatPrompt: { placeholder: '메시지를 입력하세요…' },
        chatPromptSubmit: { label: '전송' },
        colorMode: { dark: '다크', light: '라이트', switchToDark: '다크 모드로 전환', switchToLight: '라이트 모드로 전환', system: '시스템' },
        commandPalette: { back: '뒤로', close: '닫기', noData: '데이터 없음', noMatch: '결과 없음', placeholder: '명령을 입력하거나 검색하세요…' },
        contentSearch: { links: '링크', theme: '테마' },
        contentSearchButton: { label: '검색' },
        contentToc: { title: '목차' },
        dashboardSearch: { theme: '테마' },
        dashboardSearchButton: { label: '검색' },
        dashboardSidebarCollapse: { collapse: '접기', expand: '펼치기' },
        dashboardSidebarToggle: { close: '사이드바 닫기', open: '사이드바 열기' },
        error: { clear: '오류 초기화' },
        fileUpload: { removeFile: '파일 제거' },
        header: { close: '닫기', open: '열기' },
        inputMenu: { create: '"{query}" 생성', noData: '데이터 없음', noMatch: '결과 없음' },
        inputNumber: { decrement: '감소', increment: '증가' },
        modal: { close: '닫기' },
        pricingTable: { caption: '요금표' },
        prose: {
            codeCollapse: { closeText: '접기', name: '코드 블록', openText: '펼치기' },
            collapsible: { closeText: '접기', name: '접을 수 있는 섹션', openText: '펼치기' },
            pre: { copy: '복사' },
            prompt: { copy: '복사', openIn: '열기' }
        },
        selectMenu: { create: '"{query}" 생성', noData: '데이터 없음', noMatch: '결과 없음', search: '검색…' },
        slideover: { close: '닫기' },
        table: { noData: '데이터가 없습니다' },
        toast: { close: '닫기' }
    }
})
</script>

<template>
    <UApp :locale="locale">
        <NuxtPage />
        <div id="modal-root" />
    </UApp>
</template>
