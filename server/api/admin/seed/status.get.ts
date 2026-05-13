import { withAdmin } from '../../../utils/withAdmin'
import { withExceptionHandler } from '../../../utils/error'
import { dbMode } from '../../../utils/config'

export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async () => {
            return { dbMode }
        })
    )
)
