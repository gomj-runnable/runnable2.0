/**
 * MapPrime 서버 프록시
 *
 * /proxy/** 요청을 MAPPRIME_BASE_URL로 포워딩합니다.
 * .env에 MAPPRIME_BASE_URL을 설정해주세요.
 *
 * 예) MAPPRIME_BASE_URL=http://your-mapprime-server.com
 */
export default defineEventHandler(async (event) => {
  const baseUrl = process.env.MAPPRIME_BASE_URL

  if (!baseUrl) {
    throw createError({
      statusCode: 503,
      message: 'MAPPRIME_BASE_URL 환경변수가 설정되지 않았습니다.'
    })
  }

  // /proxy/MapPrime3DManager/... → {baseUrl}/MapPrime3DManager/...
  const path = event.path.replace(/^\/proxy/, '')
  const target = `${baseUrl}${path}`

  return proxyRequest(event, target)
})
