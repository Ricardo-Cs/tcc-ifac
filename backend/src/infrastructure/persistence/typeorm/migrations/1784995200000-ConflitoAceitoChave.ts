import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Passa a identidade do conflito aceito para uma `chave` determinística
 * (`${tipo}|${alocacoesEnvolvidas ordenadas}`), no lugar do par
 * (alocacao_id, tipo) — que não representava conflitos de duas alocações
 * (ex.: PROFESSOR_DUPLICADO). Ver `chaveConflito` no domínio.
 */
export class ConflitoAceitoChave1784995200000 implements MigrationInterface {
    name = 'ConflitoAceitoChave1784995200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" DROP CONSTRAINT "UQ_7a74158a3d1f9c32c296be3de9b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ADD "chave" character varying(512)`,
        );
        // Backfill dos aceites existentes (todos de uma única alocação até aqui):
        // mesmo formato que o domínio produz para um conflito de uma alocação só.
        await queryRunner.query(
            `UPDATE "conflito_aceito" SET "chave" = "tipo"::text || '|' || "alocacao_id"::text WHERE "chave" IS NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ALTER COLUMN "chave" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ADD CONSTRAINT "UQ_conflito_aceito_chave" UNIQUE ("chave")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" DROP CONSTRAINT "UQ_conflito_aceito_chave"`,
        );
        await queryRunner.query(`ALTER TABLE "conflito_aceito" DROP COLUMN "chave"`);
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ADD CONSTRAINT "UQ_7a74158a3d1f9c32c296be3de9b" UNIQUE ("alocacao_id", "tipo")`,
        );
    }
}
