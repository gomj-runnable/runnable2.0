import { defineEventHandler } from 'h3'
import { getOrDetectFeatures } from '../../utils/uml/detect-features'
import { withExceptionHandler } from '../../utils/error'
import { withAdmin } from '../../utils/withAdmin'

export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async () => {
            return await getOrDetectFeatures()
        })
    )
)
