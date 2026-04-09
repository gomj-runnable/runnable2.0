# Runnable Codex Agent Team

## Roles
- architect: 계획 수립 전용 (read-only)
- builder: 계획 기반 구현 전용
- reviewer: 변경 범위 검증 전용 (read-only)

## Recommended flow
1. architect에게 작업 브리프 작성 요청
2. 브리프 확인 후 builder에게 구현 요청
3. reviewer에게 변경 범위 리뷰 요청
4. architect에게 최종 체크 요청

## Example prompts
- architect: "아래 요구사항 기준으로 파일 단위 구현 브리프를 작성해줘. 코드 수정은 하지 마."
- builder: "다음 architect 브리프를 그대로 구현해줘. 브리프 범위 밖 변경은 금지."
- reviewer: "builder 변경사항만 검토해서 치명도 순으로 이슈를 정리해줘."
