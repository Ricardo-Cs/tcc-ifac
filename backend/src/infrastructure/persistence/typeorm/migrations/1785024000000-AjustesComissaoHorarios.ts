import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajustes fechados com a comissão de horários e o orientador:
 *
 * - professor_oferta.proporcao_carga: percentual da carga do professor na
 *   oferta (codocência). Backfill 100 nos vínculos existentes (professor único
 *   = 100% pela invariante de domínio).
 * - disciplina.carga_horaria: int -> numeric(7,2) (valores como 133,33 não
 *   cabem em int). Unidade canônica: horas de 60 min.
 * - periodo_letivo.ano/semestre: derivados de `codigo` (AAAA.S). Junto,
 *   identificam o período (unique). Aborta se algum `codigo` fugir do padrão.
 * - periodo_letivo.status: RASCUNHO | VALIDADO | PUBLICADO, default RASCUNHO.
 * - oferta_disciplina.regime: ANUAL | SEMESTRAL. Backfill SEMESTRAL nas ofertas
 *   existentes (anuais moram no período de origem, não neste).
 * - restricao_professor.amparo_legal: protege restrições do Art. 98 da Lei
 *   8.112/90. Default false.
 *
 * As invariantes de negócio (soma das proporções de uma oferta = 100; transição
 * para PUBLICADO exige zero conflitos FORTES) ficam no domínio, não no banco.
 */
export class AjustesComissaoHorarios1785024000000 implements MigrationInterface {
    name = 'AjustesComissaoHorarios1785024000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // professor_oferta.proporcao_carga (NOT NULL sem default -> backfill 100)
        await queryRunner.query(
            `ALTER TABLE "professor_oferta" ADD "proporcao_carga" numeric(5,2)`,
        );
        await queryRunner.query(
            `UPDATE "professor_oferta" SET "proporcao_carga" = 100 WHERE "proporcao_carga" IS NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "professor_oferta" ALTER COLUMN "proporcao_carga" SET NOT NULL`,
        );

        // disciplina.carga_horaria: int -> numeric(7,2)
        await queryRunner.query(
            `ALTER TABLE "disciplina" ALTER COLUMN "carga_horaria" TYPE numeric(7,2) USING "carga_horaria"::numeric(7,2)`,
        );

        // periodo_letivo.ano/semestre — valida o formato AAAA.S antes de derivar.
        // Semestre só pode ser 1 ou 2 no domínio: o regex exige [12], então
        // qualquer coisa fora disso derruba a migration em vez de gravar valores
        // errados. Falha barulhento no dev.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM "periodo_letivo"
                    WHERE "codigo" !~ '^[0-9]{4}[.][12]$'
                ) THEN
                    RAISE EXCEPTION 'Backfill abortado: existe periodo_letivo.codigo fora do padrão AAAA.S com semestre 1 ou 2 (ex.: 2026.2). Corrija os registros antes de rodar a migration.';
                END IF;
            END $$;
        `);
        await queryRunner.query(`ALTER TABLE "periodo_letivo" ADD "ano" integer`);
        await queryRunner.query(`ALTER TABLE "periodo_letivo" ADD "semestre" smallint`);
        await queryRunner.query(
            `UPDATE "periodo_letivo" SET "ano" = split_part("codigo", '.', 1)::integer, "semestre" = split_part("codigo", '.', 2)::smallint`,
        );
        await queryRunner.query(
            `ALTER TABLE "periodo_letivo" ALTER COLUMN "ano" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "periodo_letivo" ALTER COLUMN "semestre" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "periodo_letivo" ADD CONSTRAINT "UQ_periodo_letivo_ano_semestre" UNIQUE ("ano", "semestre")`,
        );

        // periodo_letivo.status (default RASCUNHO)
        await queryRunner.query(
            `CREATE TYPE "public"."periodo_letivo_status_enum" AS ENUM('RASCUNHO', 'VALIDADO', 'PUBLICADO')`,
        );
        await queryRunner.query(
            `ALTER TABLE "periodo_letivo" ADD "status" "public"."periodo_letivo_status_enum" NOT NULL DEFAULT 'RASCUNHO'`,
        );

        // oferta_disciplina.regime (NOT NULL sem default -> backfill SEMESTRAL)
        await queryRunner.query(
            `CREATE TYPE "public"."oferta_disciplina_regime_enum" AS ENUM('ANUAL', 'SEMESTRAL')`,
        );
        await queryRunner.query(
            `ALTER TABLE "oferta_disciplina" ADD "regime" "public"."oferta_disciplina_regime_enum"`,
        );
        await queryRunner.query(
            `UPDATE "oferta_disciplina" SET "regime" = 'SEMESTRAL' WHERE "regime" IS NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "oferta_disciplina" ALTER COLUMN "regime" SET NOT NULL`,
        );

        // restricao_professor.amparo_legal (default false)
        await queryRunner.query(
            `ALTER TABLE "restricao_professor" ADD "amparo_legal" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "restricao_professor" DROP COLUMN "amparo_legal"`,
        );

        await queryRunner.query(`ALTER TABLE "oferta_disciplina" DROP COLUMN "regime"`);
        await queryRunner.query(`DROP TYPE "public"."oferta_disciplina_regime_enum"`);

        await queryRunner.query(`ALTER TABLE "periodo_letivo" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."periodo_letivo_status_enum"`);

        await queryRunner.query(
            `ALTER TABLE "periodo_letivo" DROP CONSTRAINT "UQ_periodo_letivo_ano_semestre"`,
        );
        await queryRunner.query(`ALTER TABLE "periodo_letivo" DROP COLUMN "semestre"`);
        await queryRunner.query(`ALTER TABLE "periodo_letivo" DROP COLUMN "ano"`);

        // Reverte numeric(7,2) -> int (lossy: valores fracionários são arredondados).
        await queryRunner.query(
            `ALTER TABLE "disciplina" ALTER COLUMN "carga_horaria" TYPE integer USING round("carga_horaria")::integer`,
        );

        await queryRunner.query(
            `ALTER TABLE "professor_oferta" DROP COLUMN "proporcao_carga"`,
        );
    }
}
