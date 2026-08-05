import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A identidade do conflito aceito passa a ser a `chave` SEMÂNTICA
 * (`tipo :: contexto :: participantes(oferta+slot[+sala]) ordenados`), em vez de
 * derivar de ids de alocação. Ver `chaveConflito` no domínio.
 *
 * A coluna `chave` já existe (migration ConflitoAceitoChave), mas seu conteúdo
 * antigo (`tipo|alocacaoIds`) é incompatível com o novo formato: nenhuma chave
 * antiga volta a casar com um recálculo. Como o projeto é greenfield (o seed não
 * cria aceites), as linhas existentes são apagadas em vez de migradas.
 *
 * `tipo` e `severidade` deixam de ser colunas: `tipo` já está na `chave` e
 * `severidade` é volátil (não faz parte da identidade). A FK `alocacao_id`
 * permanece NOT NULL ON DELETE CASCADE, agora só como gancho de limpeza — não é
 * mais a identidade.
 */
export class ConflitoAceitoChaveSemantica1785110000000
    implements MigrationInterface
{
    name = 'ConflitoAceitoChaveSemantica1785110000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Chaves antigas (formato por id de alocação) nunca mais casam — limpa.
        await queryRunner.query(`DELETE FROM "conflito_aceito"`);

        await queryRunner.query(`ALTER TABLE "conflito_aceito" DROP COLUMN "severidade"`);
        await queryRunner.query(`ALTER TABLE "conflito_aceito" DROP COLUMN "tipo"`);
        await queryRunner.query(`DROP TYPE "public"."conflito_aceito_severidade_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conflito_aceito_tipo_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // `tipo`/`severidade` não são reconstrutíveis a partir de linhas no novo
        // formato; limpa para poder recriar as colunas NOT NULL (simétrico ao up).
        await queryRunner.query(`DELETE FROM "conflito_aceito"`);

        await queryRunner.query(
            `CREATE TYPE "public"."conflito_aceito_tipo_enum" AS ENUM('PROFESSOR_DUPLICADO', 'TURMA_DUPLICADA', 'SALA_OCUPADA', 'RESTRICAO_VIOLADA', 'CARGA_SEMANAL_EXCEDIDA', 'PROFESSOR_DUPLICADO_POTENCIAL', 'RESTRICAO_NAO_IMPORTADA', 'CARGA_OFERTA_INCOMPLETA', 'CAPACIDADE_SALA_INSUFICIENTE', 'TIPO_SALA_INADEQUADO', 'HORARIO_NAO_PREFERIDO')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."conflito_aceito_severidade_enum" AS ENUM('FORTE', 'POTENCIAL', 'FRACO')`,
        );
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ADD "tipo" "public"."conflito_aceito_tipo_enum" NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "conflito_aceito" ADD "severidade" "public"."conflito_aceito_severidade_enum" NOT NULL`,
        );
    }
}
