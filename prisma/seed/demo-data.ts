import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data (for demo purposes)
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()

  console.log('Seeding demo data...')

  // Create a demo school
  const school = await prisma.school.create({
    data: {
      name: 'Lincoln High School',
      code: 'LHS-2026',
    },
  })

  // Create Eagle Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      name: 'Eagle Admin',
      email: 'admin@eaglebus.com',
      password: adminPassword,
      role: 'EAGLE_ADMIN',
    },
  })

  // Create School Admin User linked to Lincoln High School
  const schoolAdminPassword = await bcrypt.hash('school123', 10)
  await prisma.user.create({
    data: {
      name: 'Lincoln Principal',
      email: 'principal@lincoln.edu',
      password: schoolAdminPassword,
      role: 'SCHOOL_ADMIN',
    },
  })

  console.log('Seed completed successfully.')
  console.log(`Demo School ID: ${school.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
