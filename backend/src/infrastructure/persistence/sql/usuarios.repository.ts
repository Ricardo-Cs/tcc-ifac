import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsuariosRepository } from '../../../application/grade-horaria/ports';

/**
 * Resolução de usuário para o protótipo (sem autenticação): devolve um autor
 * padrão para carimbar `criadoPor`/`aceitoPor`. Prefere um ADMIN/COMISSAO ativo.
 * Quando a auth entrar, o autor virá do token e esta porta some.
 */
@Injectable()
export class SqlUsuariosRepository implements UsuariosRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async padraoId(): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT id FROM usuario
        WHERE ativo = true
        ORDER BY (papel = 'ADMIN') DESC, (papel = 'COMISSAO') DESC
        LIMIT 1`,
    );
    return rows.length > 0 ? rows[0].id : null;
  }
}
