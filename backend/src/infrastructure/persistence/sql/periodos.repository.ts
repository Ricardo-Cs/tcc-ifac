import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StatusPeriodo } from '../../../domain/comum/enums';
import {
  PeriodoResumo,
  PeriodosRepository,
} from '../../../application/grade-horaria/ports';

/**
 * Consulta de períodos letivos: listagem para a interface escolher e resolução
 * do período ativo (o `GET /grade/atual` do protótipo evita precisar saber o
 * UUID de antemão — o seed marca 2026.2 como ativo).
 */
@Injectable()
export class SqlPeriodosRepository implements PeriodosRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async listar(): Promise<PeriodoResumo[]> {
    const rows = await this.dataSource.query(
      `SELECT id, codigo, descricao, status, ativo
         FROM periodo_letivo
        ORDER BY ano DESC, semestre DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      codigo: row.codigo,
      descricao: row.descricao,
      status: row.status as StatusPeriodo,
      ativo: row.ativo,
    }));
  }

  async ativoId(): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT id FROM periodo_letivo WHERE ativo = true LIMIT 1`,
    );
    return rows.length > 0 ? rows[0].id : null;
  }
}
