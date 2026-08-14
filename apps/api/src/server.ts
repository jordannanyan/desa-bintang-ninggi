import { buatApp } from './app.js';
import { env } from './config/env.js';
import { tutupPrisma } from './lib/prisma.js';

const app = buatApp();

const server = app.listen(env.PORT, () => {
  console.log(`API desa berjalan di http://localhost:${env.PORT}`);
  console.log(`Peta endpoint: http://localhost:${env.PORT}/api`);
});

for (const sinyal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinyal, () => {
    server.close(async () => {
      await tutupPrisma();
      process.exit(0);
    });
  });
}
