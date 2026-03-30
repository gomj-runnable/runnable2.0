import 'dotenv/config'
import { db } from '../utils/db'
import { users, userAccounts } from './schema/users'
import { boards } from './schema/boards'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

async function seed() {
  console.log('🌱 Seed 작업 시작...')

  const ADMIN_ID = 'admin_master_01'
  const adminData = {
    email: 'admin@youngbok.co.kr',
    password: '!ybmc2242',
    name: '최고관리자'
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

    // 2. 게시판 생성 (기존 로직 유지)
    await db
      .insert(boards)
      .values({
        title: '온특새 은혜 나눔',
        slug: 'dawn-grace',
        groupSlug: 'dawn-prayer',
        year: 2026,
        layout: 'list',
        isActive: true,
        permissions: {
          guest: ['read', 'write'],
          member: ['read', 'write', 'comment'],
          admin: ['read', 'write', 'comment', 'delete']
        },
        options: { allowComment: true, allowGuest: true }
      })
      .onConflictDoNothing()

    console.log('✅ 게시판 설정 완료')
  } catch (error) {
    console.error('❌ Seed 작업 중 예외 발생:', error)
    process.exit(1)
  } finally {
    console.log('🏁 모든 작업 완료')
    process.exit(0)
  }
}

seed()
