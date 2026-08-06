import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AceitesRepository,
  RegistrarAceiteInput,
} from '../../../application/grade-horaria/ports';

/**
 * Lê as chaves de aceite de um período. `conflito_aceito` não tem coluna de
 * período — a decisão pende da alocação representante, então o vínculo com o
 * período vem por join com `alocacao_aula`. A `chave` é a identidade semântica
 * do conflito; é ela, não o id da alocação, que reconecta aceite e conflito
 * recomputado.
 */
@Injectable()
export class SqlAceitesRepository implements AceitesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async chavesDoPeriodo(periodoLetivoId: string): Promise<Set<string>> {
    const rows = await this.dataSource.query(
      `SELECT ca.chave
         FROM conflito_aceito ca
         JOIN alocacao_aula a ON a.id = ca.alocacao_id
        WHERE a.periodo_letivo_id = $1`,
      [periodoLetivoId],
    );
    return new Set<string>(rows.map((row) => row.chave));
  }

  async registrar(input: RegistrarAceiteInput): Promise<void> {
    // Idempotente: `chave` é UNIQUE, então aceitar de novo o mesmo conflito não
    // duplica nem falha. `id` e `aceito_em` vêm dos DEFAULTs das colunas.
    await this.dataSource.query(
      `INSERT INTO conflito_aceito (chave, alocacao_id, justificativa, aceito_por_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (chave) DO NOTHING`,
      [input.chave, input.alocacaoId, input.justificativa, input.aceitoPorId],
    );
  }
}
