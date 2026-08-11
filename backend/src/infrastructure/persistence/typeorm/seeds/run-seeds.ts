// Ponto de entrada das seeds. Roda fora do Nest (sem DI), reutilizando o mesmo
// AppDataSource do CLI do TypeORM. Uso: `npm run seed`.
import { AppDataSource } from '../data-source';
import { seedGrade2026 } from './grade-2026-2.seed';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await seedGrade2026(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Falha ao executar as seeds:', err);
  process.exitCode = 1;
});
