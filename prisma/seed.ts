import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Seed API Key
  const apiKey = 'antigravity-secret-key';
  
  await prisma.apiClient.upsert({
    where: { apiKey },
    update: {},
    create: {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'Frontend App',
      apiKey: apiKey,
      role: 'HR',
    },
  });

  console.log('Seeded ApiClient: antigravity-secret-key');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
