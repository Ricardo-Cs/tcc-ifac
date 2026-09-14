import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AlocacaoAlterada,
  AlocacoesRepository,
  CriarAlocacaoInput,
  MoverAlocacaoInput,
  OfertaParaAlocacao,
} from '@domain/grade-horaria/ports';

@Injectable()
export class SqlAlocacoesRepository implements AlocacoesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async criar(input: CriarAlocacaoInput): Promise<AlocacaoAlterada> {
    const rows = await this.dataSource.query(
      `INSERT INTO alocacao_aula
         (oferta_id, slot_horario_id, sala_id, periodo_letivo_id, grupo_bloco, observacoes, criado_por_id)
       SELECT $1, $2, $3,
              (SELECT periodo_letivo_id FROM oferta_disciplina WHERE id = $1),
              $4, $5, $6
       RETURNING id, periodo_letivo_id`,
      [
        input.ofertaId,
        input.slotHorarioId,
        input.salaId ?? null,
        input.grupoBloco ?? null,
        input.observacoes ?? null,
        input.criadoPorId,
      ],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Oferta ${input.ofertaId} não encontrada.`);
    }
    return { id: rows[0].id, periodoLetivoId: rows[0].periodo_letivo_id };
  }

  async mover(
    id: string,
    input: MoverAlocacaoInput,
  ): Promise<AlocacaoAlterada> {
    const sets: string[] = [`version = version + 1`];
    const params: unknown[] = [id];
    if (input.slotHorarioId !== undefined) {
      params.push(input.slotHorarioId);
      sets.push(`slot_horario_id = $${params.length}`);
    }
    if (input.salaId !== undefined) {
      params.push(input.salaId);
      sets.push(`sala_id = $${params.length}`);
    }
    sets.push(`atualizado_em = now()`);

    const guarda = this.guardaDeVersao(input.versaoBase, params);
    const resultado = await this.dataSource.query(
      `UPDATE alocacao_aula SET ${sets.join(', ')}
        WHERE id = $1${guarda}
       RETURNING id, periodo_letivo_id`,
      params,
    );
    const rows = linhasComRetorno(resultado);
    if (rows.length === 0) {
      await this.recusarEscritaSemLinha(id, input.versaoBase);
    }
    return { id: rows[0].id, periodoLetivoId: rows[0].periodo_letivo_id };
  }

  async remover(id: string, versaoBase?: number): Promise<AlocacaoAlterada> {
    const params: unknown[] = [id];
    const guarda = this.guardaDeVersao(versaoBase, params);
    const resultado = await this.dataSource.query(
      `DELETE FROM alocacao_aula WHERE id = $1${guarda}
       RETURNING id, periodo_letivo_id`,
      params,
    );
    const rows = linhasComRetorno(resultado);
    if (rows.length === 0) {
      await this.recusarEscritaSemLinha(id, versaoBase);
    }
    return { id: rows[0].id, periodoLetivoId: rows[0].periodo_letivo_id };
  }

  private guardaDeVersao(
    versaoBase: number | undefined,
    params: unknown[],
  ): string {
    if (versaoBase === undefined) return '';
    params.push(versaoBase);
    return ` AND version = $${params.length}`;
  }

  private async recusarEscritaSemLinha(
    id: string,
    versaoBase: number | undefined,
  ): Promise<never> {
    if (versaoBase !== undefined) {
      const existe = await this.dataSource.query(
        `SELECT 1 FROM alocacao_aula WHERE id = $1`,
        [id],
      );
      if (existe.length > 0) {
        throw new ConflictException(
          'Esta aula foi alterada por outra pessoa. Recarregue a grade e refaça a ação.',
        );
      }
    }
    throw new NotFoundException(`Alocação ${id} não encontrada.`);
  }

  async ofertaParaAlocacao(
    ofertaId: string,
  ): Promise<OfertaParaAlocacao | null> {
    const rows = await this.dataSource.query(
      `SELECT periodo_letivo_id, sala_id FROM oferta_disciplina WHERE id = $1`,
      [ofertaId],
    );
    if (rows.length === 0) {
      return null;
    }
    return {
      periodoLetivoId: rows[0].periodo_letivo_id,
      salaPadraoId: rows[0].sala_id ?? null,
    };
  }

  async periodoDaAlocacao(id: string): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT periodo_letivo_id FROM alocacao_aula WHERE id = $1`,
      [id],
    );
    return rows[0]?.periodo_letivo_id ?? null;
  }
}

function linhasComRetorno(resultado: unknown): any[] {
  if (Array.isArray(resultado) && Array.isArray(resultado[0])) {
    return resultado[0];
  }
  return resultado as any[];
}
