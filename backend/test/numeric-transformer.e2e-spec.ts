import 'dotenv/config';
import {
    Column,
    DataSource,
    DataSourceOptions,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {
    assertDatabaseEnv,
    buildDataSourceOptions,
} from '../src/infrastructure/persistence/typeorm/typeorm-options';
import { numericTransformer } from '../src/infrastructure/persistence/typeorm/transformers/numeric.transformer';

/**
 * Congela, contra o driver Postgres real, que uma coluna `numeric` com o
 * `numericTransformer` volta como `number` — não como a string que o `pg`
 * entrega por padrão. Se alguém remover o transformer de `cargaHoraria` /
 * `proporcaoCarga`, este teste quebra.
 *
 * Usa uma tabela-sonda descartável (a única entidade deste DataSource), com
 * `synchronize`/`migrationsRun: false` — não roda a migration nem toca as
 * tabelas de domínio. Precisa do Postgres do projeto de pé (mesmas variáveis de
 * ambiente do app); roda com `npm run test:e2e`.
 */
@Entity('numeric_transformer_probe')
class NumericProbe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'numeric', precision: 7, scale: 2, transformer: numericTransformer })
    valor: number;
}

describe('numericTransformer (integração Postgres)', () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        const base = buildDataSourceOptions(assertDatabaseEnv(process.env));
        dataSource = new DataSource({
            ...base,
            entities: [NumericProbe],
            migrations: [],
            migrationsRun: false,
            synchronize: true,
            logging: false,
        } as DataSourceOptions);
        await dataSource.initialize();
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.query('DROP TABLE IF EXISTS "numeric_transformer_probe"');
            await dataSource.destroy();
        }
    });

    it('grava um decimal e lê de volta como number, não string', async () => {
        const repo = dataSource.getRepository(NumericProbe);
        const salvo = await repo.save(repo.create({ valor: 133.33 }));

        // Lê do banco (objeto novo), não o que ficou em memória após o save.
        const lido = await repo.findOneByOrFail({ id: salvo.id });

        expect(typeof lido.valor).toBe('number');
        expect(lido.valor).toBeCloseTo(133.33, 2);
    });
});
