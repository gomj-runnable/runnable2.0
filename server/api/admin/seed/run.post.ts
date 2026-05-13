import { withAdmin } from '../../../utils/withAdmin'
import { withExceptionHandler, badRequest } from '../../../utils/error'
import { getDb } from '../../../database/client'
import { users, userAccounts } from '../../../database/schema/users'
import { ROLES } from '#shared/constants/roles'
import { hashPassword } from 'better-auth/crypto'

export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async () => {
            const adminPassword = process.env.ADMIN_SEED_PASSWORD
            if (!adminPassword) {
                throw badRequest('ADMIN_SEED_PASSWORD 환경변수가 설정되지 않았습니다.')
            }

            const db = await getDb()
            const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@runnable.com'
            const ADMIN_ROLE_ID = 'admin_role_master_01'
            const hashedPassword = await hashPassword(adminPassword)

            await db.transaction(async (tx) => {
                await tx
                    .insert(users)
                    .values({
                        id: ADMIN_ROLE_ID,
                        name: '최고관리자',
                        email: adminEmail,
                        role: ROLES.ADMIN,
                        emailVerified: true
                    })
                    .onConflictDoUpdate({
                        target: users.id,
                        set: { email: adminEmail, name: '최고관리자', role: ROLES.ADMIN }
                    })

                await tx
                    .insert(userAccounts)
                    .values({
                        id: `acc_${ADMIN_ROLE_ID}`,
                        userId: ADMIN_ROLE_ID,
                        accountId: adminEmail,
                        providerId: 'credential',
                        password: hashedPassword
                    })
                    .onConflictDoUpdate({
                        target: userAccounts.id,
                        set: { password: hashedPassword }
                    })
            })

            return {
                success: true,
                executedAt: new Date().toISOString(),
                message: '최고관리자 계정 시드 완료 (시설물 데이터는 CLI pnpm seed 사용)'
            }
        })
    )
)
