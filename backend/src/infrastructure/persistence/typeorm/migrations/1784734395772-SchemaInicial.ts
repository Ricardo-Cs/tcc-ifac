import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaInicial1784734395772 implements MigrationInterface {
    name = 'SchemaInicial1784734395772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "periodo_letivo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(10) NOT NULL, "descricao" text, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "ativo" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_abb0cf72d9156444b33669aa7cb" UNIQUE ("codigo"), CONSTRAINT "PK_7a507a7785368c6facc80ce95b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ee457f0e7e5f18af645a710835" ON "periodo_letivo"  ("ativo") WHERE ativo = true`);
        await queryRunner.query(`CREATE TYPE "public"."usuario_papel_enum" AS ENUM('ADMIN', 'COMISSAO', 'CONSULTA')`);
        await queryRunner.query(`CREATE TABLE "usuario" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "senha" character varying(255) NOT NULL, "papel" "public"."usuario_papel_enum" NOT NULL DEFAULT 'CONSULTA', "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "coleta_restricao" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "importado_em" TIMESTAMP WITH TIME ZONE NOT NULL, "arquivo_origem" character varying(255), "periodo_letivo_id" uuid NOT NULL, "importado_por_id" uuid NOT NULL, CONSTRAINT "UQ_bc9f53fbd298dfd66888515aa52" UNIQUE ("periodo_letivo_id"), CONSTRAINT "PK_f9dd16df94346f868fa3cec8b85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."curso_modalidade_enum" AS ENUM('SUPERIOR', 'INTEGRADO', 'SUBSEQUENTE')`);
        await queryRunner.query(`CREATE TYPE "public"."curso_turno_padrao_enum" AS ENUM('MANHA', 'TARDE', 'NOITE')`);
        await queryRunner.query(`CREATE TABLE "curso" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(255) NOT NULL, "sigla" character varying(20) NOT NULL, "modalidade" "public"."curso_modalidade_enum" NOT NULL, "turno_padrao" "public"."curso_turno_padrao_enum" NOT NULL, "carga_horaria" integer, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_76073a915621326fb85f28ecc5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."disciplina_tipo_sala_requerido_enum" AS ENUM('COMUM', 'LABORATORIO', 'AUDITORIO', 'QUADRA')`);
        await queryRunner.query(`CREATE TABLE "disciplina" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(20) NOT NULL, "nome" character varying(255) NOT NULL, "carga_horaria" integer NOT NULL, "tipo_sala_requerido" "public"."disciplina_tipo_sala_requerido_enum", CONSTRAINT "UQ_273d4ded06c2b50c52e176b7671" UNIQUE ("codigo"), CONSTRAINT "PK_02bd5fd4e075740beb27bcdcddf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curso_disciplina" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "periodo" smallint NOT NULL, "curso_id" uuid NOT NULL, "disciplina_id" uuid NOT NULL, CONSTRAINT "UQ_31fae7cc355ab55d55cb62b99fb" UNIQUE ("curso_id", "disciplina_id", "periodo"), CONSTRAINT "PK_f9357f20fce61200788cd91af9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "professor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(255) NOT NULL, "email" character varying(255), "siape" character varying(8) NOT NULL, "titulacao" character varying(100), "max_aulas_semanais" integer NOT NULL DEFAULT '20', "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_811657fb678e39277274068a0ab" UNIQUE ("siape"), CONSTRAINT "PK_39a6c8f16280dc3bc3ffdc41e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "turma" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(100) NOT NULL, "semestre_entrada" character varying(10) NOT NULL, "quantidade_alunos" integer, "ativa" boolean NOT NULL DEFAULT true, "curso_id" uuid NOT NULL, CONSTRAINT "PK_b7da8685b4c588d7bb0c3b30930" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oferta_disciplina" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aulas_semana" smallint NOT NULL, "observacoes" text, "turma_id" uuid NOT NULL, "disciplina_id" uuid NOT NULL, "periodo_letivo_id" uuid NOT NULL, CONSTRAINT "UQ_4f0bead12ad055df90fa67e793a" UNIQUE ("turma_id", "disciplina_id", "periodo_letivo_id"), CONSTRAINT "PK_a59605e657d60cba42f7296ecb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "professor_oferta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "professor_id" uuid NOT NULL, "oferta_id" uuid NOT NULL, CONSTRAINT "UQ_f8921336d74aaea3290fdc91fad" UNIQUE ("professor_id", "oferta_id"), CONSTRAINT "PK_d222822182de9f6edfc4fa0cdc0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."slot_horario_turno_enum" AS ENUM('MANHA', 'TARDE', 'NOITE')`);
        await queryRunner.query(`CREATE TABLE "slot_horario" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(10) NOT NULL, "dia_semana" smallint NOT NULL, "turno" "public"."slot_horario_turno_enum" NOT NULL, "ordem" smallint NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fim" TIME NOT NULL, CONSTRAINT "UQ_483b9357db8730b61b515cc2257" UNIQUE ("codigo"), CONSTRAINT "UQ_d9799b861b4268279b3b9d0fa50" UNIQUE ("dia_semana", "turno", "ordem"), CONSTRAINT "CHK_ba1967782d3ed9b036d3e7b224" CHECK ("dia_semana" BETWEEN 1 AND 6), CONSTRAINT "PK_89a6eeb34bbf01b8c560924bc89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "restricao_professor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "motivo" text, "professor_id" uuid NOT NULL, "slot_horario_id" uuid NOT NULL, "periodo_letivo_id" uuid NOT NULL, "coleta_id" uuid NOT NULL, CONSTRAINT "UQ_a0edbd7df9a23baf5668b3a450e" UNIQUE ("professor_id", "slot_horario_id", "periodo_letivo_id"), CONSTRAINT "PK_92bd0a7fd2e11527d25288e19df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sala_tipo_enum" AS ENUM('COMUM', 'LABORATORIO', 'AUDITORIO', 'QUADRA')`);
        await queryRunner.query(`CREATE TABLE "sala" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(100) NOT NULL, "tipo" "public"."sala_tipo_enum" NOT NULL DEFAULT 'COMUM', "capacidade" integer, "ativa" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2c4174154c3e8261b363c66cc26" UNIQUE ("nome"), CONSTRAINT "PK_4e5fe0d3e30b64508d2a59daa40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "alocacao_aula" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "grupo_bloco" uuid, "observacoes" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "oferta_id" uuid NOT NULL, "slot_horario_id" uuid NOT NULL, "sala_id" uuid, "periodo_letivo_id" uuid NOT NULL, "criado_por_id" uuid NOT NULL, CONSTRAINT "PK_29ce64c7f3f6908ae10e4c0925d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b9bc55c286e93f48a421f3dffa" ON "alocacao_aula"  ("oferta_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_79941594172e055ce3c0371e7d" ON "alocacao_aula"  ("periodo_letivo_id", "slot_horario_id") `);
        await queryRunner.query(`CREATE TYPE "public"."conflito_aceito_tipo_enum" AS ENUM('PROFESSOR_DUPLICADO', 'TURMA_DUPLICADA', 'SALA_OCUPADA', 'RESTRICAO_VIOLADA', 'CARGA_SEMANAL_EXCEDIDA', 'PROFESSOR_DUPLICADO_POTENCIAL', 'RESTRICAO_NAO_IMPORTADA', 'CARGA_OFERTA_INCOMPLETA', 'CAPACIDADE_SALA_INSUFICIENTE', 'TIPO_SALA_INADEQUADO', 'HORARIO_NAO_PREFERIDO')`);
        await queryRunner.query(`CREATE TYPE "public"."conflito_aceito_severidade_enum" AS ENUM('FORTE', 'POTENCIAL', 'FRACO')`);
        await queryRunner.query(`CREATE TABLE "conflito_aceito" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo" "public"."conflito_aceito_tipo_enum" NOT NULL, "severidade" "public"."conflito_aceito_severidade_enum" NOT NULL, "justificativa" text NOT NULL, "aceito_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "alocacao_id" uuid NOT NULL, "aceito_por_id" uuid NOT NULL, CONSTRAINT "UQ_7a74158a3d1f9c32c296be3de9b" UNIQUE ("alocacao_id", "tipo"), CONSTRAINT "PK_b969e311a0bc96f28a8937acdd8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "coleta_restricao" ADD CONSTRAINT "FK_bc9f53fbd298dfd66888515aa52" FOREIGN KEY ("periodo_letivo_id") REFERENCES "periodo_letivo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coleta_restricao" ADD CONSTRAINT "FK_42cccff121884d43a17a0595d8e" FOREIGN KEY ("importado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curso_disciplina" ADD CONSTRAINT "FK_73ff5d46f85ae34ae533f7391f1" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curso_disciplina" ADD CONSTRAINT "FK_0941d35c5d88a19dafb5f0346a6" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turma" ADD CONSTRAINT "FK_a70d754fe6e447c37c4f3741d27" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" ADD CONSTRAINT "FK_c199e537b0f4f85bd0c3c0bf899" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" ADD CONSTRAINT "FK_c0cf6dc05bfbfa005c22b4b51ec" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" ADD CONSTRAINT "FK_9800e9050e36a0419533a124caf" FOREIGN KEY ("periodo_letivo_id") REFERENCES "periodo_letivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professor_oferta" ADD CONSTRAINT "FK_5be949e603848cf63472408b131" FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professor_oferta" ADD CONSTRAINT "FK_2a73f1ffcdd3f9b4163df8b8a32" FOREIGN KEY ("oferta_id") REFERENCES "oferta_disciplina"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" ADD CONSTRAINT "FK_d6bac75a7cff779b8701c354159" FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" ADD CONSTRAINT "FK_3a7534a1d50ab20e1020317441c" FOREIGN KEY ("slot_horario_id") REFERENCES "slot_horario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" ADD CONSTRAINT "FK_f54ce5a3abd8c4155c37c84023d" FOREIGN KEY ("periodo_letivo_id") REFERENCES "periodo_letivo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" ADD CONSTRAINT "FK_8cbb824b9c8e03cebe048d8af08" FOREIGN KEY ("coleta_id") REFERENCES "coleta_restricao"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" ADD CONSTRAINT "FK_b9bc55c286e93f48a421f3dffa9" FOREIGN KEY ("oferta_id") REFERENCES "oferta_disciplina"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" ADD CONSTRAINT "FK_33b7824bcb5dfb6445008f97de9" FOREIGN KEY ("slot_horario_id") REFERENCES "slot_horario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" ADD CONSTRAINT "FK_2fad59288ccf01f8780e4ae3ddb" FOREIGN KEY ("sala_id") REFERENCES "sala"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" ADD CONSTRAINT "FK_1535e31030af4ebb3cd8920d8f5" FOREIGN KEY ("periodo_letivo_id") REFERENCES "periodo_letivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" ADD CONSTRAINT "FK_bab8fea9a3a3ffdfed0e9587733" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conflito_aceito" ADD CONSTRAINT "FK_cc86a12278afc090e5e1a5d0816" FOREIGN KEY ("alocacao_id") REFERENCES "alocacao_aula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conflito_aceito" ADD CONSTRAINT "FK_fd5856514e41999d491d198e23a" FOREIGN KEY ("aceito_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conflito_aceito" DROP CONSTRAINT "FK_fd5856514e41999d491d198e23a"`);
        await queryRunner.query(`ALTER TABLE "conflito_aceito" DROP CONSTRAINT "FK_cc86a12278afc090e5e1a5d0816"`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" DROP CONSTRAINT "FK_bab8fea9a3a3ffdfed0e9587733"`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" DROP CONSTRAINT "FK_1535e31030af4ebb3cd8920d8f5"`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" DROP CONSTRAINT "FK_2fad59288ccf01f8780e4ae3ddb"`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" DROP CONSTRAINT "FK_33b7824bcb5dfb6445008f97de9"`);
        await queryRunner.query(`ALTER TABLE "alocacao_aula" DROP CONSTRAINT "FK_b9bc55c286e93f48a421f3dffa9"`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" DROP CONSTRAINT "FK_8cbb824b9c8e03cebe048d8af08"`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" DROP CONSTRAINT "FK_f54ce5a3abd8c4155c37c84023d"`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" DROP CONSTRAINT "FK_3a7534a1d50ab20e1020317441c"`);
        await queryRunner.query(`ALTER TABLE "restricao_professor" DROP CONSTRAINT "FK_d6bac75a7cff779b8701c354159"`);
        await queryRunner.query(`ALTER TABLE "professor_oferta" DROP CONSTRAINT "FK_2a73f1ffcdd3f9b4163df8b8a32"`);
        await queryRunner.query(`ALTER TABLE "professor_oferta" DROP CONSTRAINT "FK_5be949e603848cf63472408b131"`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" DROP CONSTRAINT "FK_9800e9050e36a0419533a124caf"`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" DROP CONSTRAINT "FK_c0cf6dc05bfbfa005c22b4b51ec"`);
        await queryRunner.query(`ALTER TABLE "oferta_disciplina" DROP CONSTRAINT "FK_c199e537b0f4f85bd0c3c0bf899"`);
        await queryRunner.query(`ALTER TABLE "turma" DROP CONSTRAINT "FK_a70d754fe6e447c37c4f3741d27"`);
        await queryRunner.query(`ALTER TABLE "curso_disciplina" DROP CONSTRAINT "FK_0941d35c5d88a19dafb5f0346a6"`);
        await queryRunner.query(`ALTER TABLE "curso_disciplina" DROP CONSTRAINT "FK_73ff5d46f85ae34ae533f7391f1"`);
        await queryRunner.query(`ALTER TABLE "coleta_restricao" DROP CONSTRAINT "FK_42cccff121884d43a17a0595d8e"`);
        await queryRunner.query(`ALTER TABLE "coleta_restricao" DROP CONSTRAINT "FK_bc9f53fbd298dfd66888515aa52"`);
        await queryRunner.query(`DROP TABLE "conflito_aceito"`);
        await queryRunner.query(`DROP TYPE "public"."conflito_aceito_severidade_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conflito_aceito_tipo_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79941594172e055ce3c0371e7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9bc55c286e93f48a421f3dffa"`);
        await queryRunner.query(`DROP TABLE "alocacao_aula"`);
        await queryRunner.query(`DROP TABLE "sala"`);
        await queryRunner.query(`DROP TYPE "public"."sala_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "restricao_professor"`);
        await queryRunner.query(`DROP TABLE "slot_horario"`);
        await queryRunner.query(`DROP TYPE "public"."slot_horario_turno_enum"`);
        await queryRunner.query(`DROP TABLE "professor_oferta"`);
        await queryRunner.query(`DROP TABLE "oferta_disciplina"`);
        await queryRunner.query(`DROP TABLE "turma"`);
        await queryRunner.query(`DROP TABLE "professor"`);
        await queryRunner.query(`DROP TABLE "curso_disciplina"`);
        await queryRunner.query(`DROP TABLE "disciplina"`);
        await queryRunner.query(`DROP TYPE "public"."disciplina_tipo_sala_requerido_enum"`);
        await queryRunner.query(`DROP TABLE "curso"`);
        await queryRunner.query(`DROP TYPE "public"."curso_turno_padrao_enum"`);
        await queryRunner.query(`DROP TYPE "public"."curso_modalidade_enum"`);
        await queryRunner.query(`DROP TABLE "coleta_restricao"`);
        await queryRunner.query(`DROP TABLE "usuario"`);
        await queryRunner.query(`DROP TYPE "public"."usuario_papel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee457f0e7e5f18af645a710835"`);
        await queryRunner.query(`DROP TABLE "periodo_letivo"`);
    }

}
