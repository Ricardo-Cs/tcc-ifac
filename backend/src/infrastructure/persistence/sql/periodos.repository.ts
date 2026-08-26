import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PeriodosRepository } from '@domain/grade-horaria/ports';

@Injectable()
export class SqlPeriodosRepository implements PeriodosRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async ativoId(): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT id FROM periodo_letivo WHERE ativo = true LIMIT 1`,
    );
    return rows.length > 0 ? rows[0].id : null;
  }
}
