export const useRouteDownloadSideeffect = () => {
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
