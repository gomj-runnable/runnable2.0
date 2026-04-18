import 'dotenv/config'

async function seed() {
  if (process.env.USE_DATABASE_MODE === 'MEMORY') {
    console.log('MEMORY 모드에서는 seed를 실행하지 않습니다.')
    process.exit(0)
  }

  const { db } = await import('../utils/db')
  const { users, userAccounts } = await import('./schema/users')
  const { hashPassword } = await import('better-auth/crypto')

  console.log('🌱 Seed 작업 시작...')

  const ADMIN_ID = 'admin_master_01'
  const adminData = {
    email: 'admin@runnable.local',
    password: '!runnable2242',
    name: '최고관리자'
  }

  if (!db) {
    console.error('DB 연결 실패: db가 null입니다.')
    process.exit(1)
  }

  try {
    // 1. 관리자 계정 생성 (Upsert 방식: 있으면 업데이트, 없으면 삽입)
    const hashedPassword = await hashPassword(adminData.password)

    await db.transaction(async (tx) => {
      // 1-1. users 테이블 (id 기준 중복 체크)
      await tx
        .insert(users)
        .values({
          id: ADMIN_ID,
          name: adminData.name,
          email: adminData.email,
          role: 10,
          emailVerified: true
        })
        .onConflictDoUpdate({
          target: users.id, // ID가 겹치면
          set: { email: adminData.email, name: adminData.name, role: 10 } // 정보를 최신화
        })

      // 1-2. user_accounts 테이블 (userId 기준 중복 체크)
      await tx
        .insert(userAccounts)
        .values({
          id: `acc_${ADMIN_ID}`,
          userId: ADMIN_ID,
          accountId: adminData.email,
          providerId: 'credential',
          password: hashedPassword
        })
        .onConflictDoUpdate({
          target: userAccounts.id,
          set: { password: hashedPassword } // 비밀번호 변경 시 반영
        })
    })
    console.log('✅ 관리자 계정 설정 완료 (ID: ' + ADMIN_ID + ')')

  } catch (error) {
    console.error('❌ Seed 작업 중 예외 발생:', error)
    process.exit(1)
  } finally {
    console.log('🏁 모든 작업 완료')
    process.exit(0)
  }
}

seed()
