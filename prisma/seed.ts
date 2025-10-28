import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test project
  const project = await prisma.project.create({
    data: {
      name: 'Street Signs Detection',
      description: 'Annotate street signs for autonomous driving',
      toolType: 'image',
      annotationType: 'bounding-box',
      status: 'active',
      totalTasks: 0,
      completedTasks: 0,
      labels: {
        create: [
          {
            name: 'Stop Sign',
            color: '#EF4444',
            description: 'Red octagonal stop sign',
            shortcut: '1'
          },
          {
            name: 'Speed Limit',
            color: '#3B82F6',
            description: 'Speed limit signs',
            shortcut: '2'
          },
          {
            name: 'Yield',
            color: '#F59E0B',
            description: 'Yellow yield sign',
            shortcut: '3'
          },
          {
            name: 'Traffic Light',
            color: '#10B981',
            description: 'Traffic signal lights',
            shortcut: '4'
          }
        ]
      }
    },
    include: {
      labels: true
    }
  })

  console.log('✅ Created project:', project.name)
  console.log('✅ Created', project.labels.length, 'labels')

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
