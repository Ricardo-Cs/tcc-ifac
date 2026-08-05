import { ValueTransformer } from 'typeorm';

/**
 * Colunas `numeric`/`decimal` voltam do driver `pg` como STRING (o `pg` não
 * assume que caibam num `number` de 64 bits). Sem este transformer, uma coluna
 * tipada como `number` no TypeScript entregaria `'133.33'` na leitura — e uma
 * comparação/aritmética silenciosa (`carga > 40`, soma de proporções) daria
 * resultado errado sem erro de tipo.
 *
 * Aplicado em toda coluna numeric do projeto (ver `cargaHoraria`,
 * `proporcaoCarga`) para que o valor lido seja sempre `number`. Escrita passa
 * direto — o `pg` aceita `number` num parâmetro numeric.
 */
export const numericTransformer: ValueTransformer = {
    to(value: number | null | undefined): number | null | undefined {
        return value;
    },
    from(value: string | null | undefined): number | null | undefined {
        return value === null || value === undefined ? value : Number(value);
    },
};
