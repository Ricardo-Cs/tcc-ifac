import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  PeriodoFechadoParaEdicaoError,
  garantirPeriodoEditavel,
} from '@domain/grade-horaria/periodo-editavel';
import { PERIODOS_REPOSITORY } from '@domain/grade-horaria/ports';
import type { PeriodosRepository } from '@domain/grade-horaria/ports';

/**
 * Ponto único que aplica a regra "só o período corrente aceita escrita" nas
 * escritas da grade (criar/mover/remover alocação e aceitar conflito). Resolve o
 * período ativo e delega a decisão à regra de domínio pura; traduz a violação
 * para `409 Conflict`. Centralizado aqui para não repetir o fetch do ativo e a
 * tradução do erro em cada use-case.
 */
@Injectable()
export class PeriodoEditavelGuard {
  constructor(
    @Inject(PERIODOS_REPOSITORY)
    private readonly periodos: PeriodosRepository,
  ) {}

  async garantir(periodoId: string): Promise<void> {
    try {
      garantirPeriodoEditavel(periodoId, await this.periodos.ativoId());
    } catch (erro) {
      if (erro instanceof PeriodoFechadoParaEdicaoError) {
        throw new ConflictException(erro.message);
      }
      throw erro;
    }
  }
}
