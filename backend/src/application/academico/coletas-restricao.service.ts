import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COLETAS_RESTRICAO_REPOSITORY,
  ColetaRestricao,
  CriarColetaRestricaoInput,
} from '@domain/academico/coleta-restricao';
import type { ColetasRestricaoRepository } from '@domain/academico/coleta-restricao';

@Injectable()
export class ColetasRestricaoService {
  constructor(
    @Inject(COLETAS_RESTRICAO_REPOSITORY)
    private readonly coletas: ColetasRestricaoRepository,
  ) {}

  buscarPorPeriodo(periodoLetivoId: string): Promise<ColetaRestricao | null> {
    return this.coletas.buscarPorPeriodo(periodoLetivoId);
  }

  criar(input: CriarColetaRestricaoInput): Promise<ColetaRestricao> {
    return this.coletas.criar(input);
  }

  async remover(id: string): Promise<void> {
    const removido = await this.coletas.remover(id);
    if (!removido) {
      throw new NotFoundException(`Coleta de restrições ${id} não encontrada.`);
    }
  }
}
