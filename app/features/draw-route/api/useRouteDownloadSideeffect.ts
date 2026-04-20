/**
 * 텍스트 파일을 브라우저 다운로드로 제공하는 sideeffect composable.
 * Blob URL을 생성하고 임시 앵커를 클릭하는 방식으로 파일을 내려받는다.
 */
export const useRouteDownloadSideeffect = () => {
    /**
     * 텍스트 콘텐츠를 지정한 파일명과 MIME 타입으로 다운로드한다.
     *
     * @param fileName - 저장될 파일명 (확장자 포함)
     * @param content - 파일에 저장할 텍스트 내용
     * @param contentType - MIME 타입 문자열 (예: `'application/gpx+xml;charset=utf-8'`)
     */
    const downloadTextFile = (fileName: string, content: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType })
        const url = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')

        anchor.href = url
        anchor.download = fileName
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        window.URL.revokeObjectURL(url)
    }

    return { downloadTextFile }
}
