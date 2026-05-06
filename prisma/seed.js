const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database for seeding');

    const query = `
      INSERT INTO "ApiClient" (id, "apiKey", name, role, "createdAt")
      VALUES ('12345678-1234-1234-1234-123456789012', 'antigravity-secret-key', 'Frontend App', 'HR', NOW())
      ON CONFLICT ("apiKey") DO NOTHING;
    `;

    await client.query(query);
    console.log('Seeded ApiClient: antigravity-secret-key');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
