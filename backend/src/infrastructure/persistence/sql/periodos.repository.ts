import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PeriodoPublicadoResumo,
  PeriodosRepository,
} from '@domain/grade-horaria/ports';

@Injectable()
export class SqlPeriodosRepository implements PeriodosRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async ativoId(): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT id FROM periodo_letivo WHERE ativo = true LIMIT 1`,
    );
    return rows.length > 0 ? rows[0].id : null;
  }

  async snapshotPublicadoPorCodigo(
    codigo: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(
      `SELECT grade_publicada FROM periodo_letivo WHERE codigo = $1 AND status = 'PUBLICADO' LIMIT 1`,
      [codigo],
    );
    return rows.length > 0 ? (rows[0].grade_publicada ?? null) : null;
  }

  async listarPublicados(): Promise<PeriodoPublicadoResumo[]> {
    const rows = await this.dataSource.query(
      `SELECT codigo, descricao, ano, semestre,
              to_char(data_inicio, 'YYYY-MM-DD') AS data_inicio,
              to_char(data_fim, 'YYYY-MM-DD') AS data_fim
       FROM periodo_letivo
       WHERE status = 'PUBLICADO'
       ORDER BY ano DESC, semestre DESC`,
    );
    return rows.map((r: Record<string, unknown>) => ({
      codigo: r.codigo as string,
      descricao: (r.descricao as string | null) ?? null,
      ano: Number(r.ano),
      semestre: Number(r.semestre),
      dataInicio: r.data_inicio as string,
      dataFim: r.data_fim as string,
    }));
  }
}
