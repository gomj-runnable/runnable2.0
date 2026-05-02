export default defineAppConfig({
    ui: {
        colors: {
            primary: 'green',
            neutral: 'slate'
        },
        slideover: {
            slots: {
                overlay: 'z-30',
                content: 'z-30'
            }
        },
        drawer: {
            slots: {
                overlay: 'z-40',
                content: 'z-40'
            }
        },
        modal: {
            slots: {
                overlay: 'z-50',
                content: 'z-50'
            }
        }
    }
})
