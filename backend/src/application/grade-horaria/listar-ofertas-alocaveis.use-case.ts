import { Inject, Injectable } from '@nestjs/common';
import { construirSnapshot } from '../../domain/grade-horaria/construir-snapshot';
import { GradeSnapshot } from '../../domain/grade-horaria/snapshot';
import {
  OfertaComCargaRestante,
  ofertasAlocaveis,
} from '../../domain/grade-horaria/ofertas-alocaveis';
import { SNAPSHOT_LOADER } from '@domain/grade-horaria/ports';
import type { SnapshotLoader } from '@domain/grade-horaria/ports';

export interface ResultadoOfertasAlocaveis {
  periodoLetivoId: string;
  /** O estado carregado, para a apresentação resolver nomes sem recarregar. */
  snapshot: GradeSnapshot;
  /** As ofertas com carga a alocar (a matemática vive no domínio). */
  ofertas: OfertaComCargaRestante[];
}

/**
 * Lista as ofertas do período que ainda têm aula a pôr na grade — o catálogo do
 * qual a comissão arrasta uma disciplina para uma célula vazia. Reusa o mesmo
 * `SnapshotLoader` do motor de conflitos (uma fonte de verdade do estado do
 * período) e delega a conta de carga restante à função pura do domínio. Não roda
 * regras: é uma consulta, não uma avaliação.
 */
@Injectable()
export class ListarOfertasAlocaveisUseCase {
  constructor(
    @Inject(SNAPSHOT_LOADER) private readonly loader: SnapshotLoader,
  ) {}

  async listar(periodoLetivoId: string): Promise<ResultadoOfertasAlocaveis> {
    const dados = await this.loader.carregar(periodoLetivoId);
    const snapshot = construirSnapshot(dados);
    return {
      periodoLetivoId,
      snapshot,
      ofertas: ofertasAlocaveis(snapshot),
    };
  }
}
