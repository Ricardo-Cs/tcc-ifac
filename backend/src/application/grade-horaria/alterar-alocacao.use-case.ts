import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ALOCACOES_REPOSITORY,
  AlocacaoAlterada,
  MoverAlocacaoInput,
} from '@domain/grade-horaria/ports';
import type {
  AlocacoesRepository,
  CriarAlocacaoInput,
} from '@domain/grade-horaria/ports';
import { PeriodoEditavelGuard } from './periodo-editavel.guard';

export type NovaAlocacao = Omit<CriarAlocacaoInput, 'criadoPorId'>;

@Injectable()
export class AlterarAlocacaoUseCase {
  constructor(
    @Inject(ALOCACOES_REPOSITORY)
    private readonly alocacoes: AlocacoesRepository,
    private readonly periodoEditavel: PeriodoEditavelGuard,
  ) {}

  async criar(
    comando: NovaAlocacao,
    criadoPorId: string,
  ): Promise<AlocacaoAlterada> {
    const oferta = await this.alocacoes.ofertaParaAlocacao(comando.ofertaId);
    if (!oferta) {
      throw new NotFoundException(`Oferta ${comando.ofertaId} não encontrada.`);
    }
    await this.periodoEditavel.garantir(oferta.periodoLetivoId);

    const salaId =
      comando.salaId === undefined ? oferta.salaPadraoId : comando.salaId;

    return this.alocacoes.criar({ ...comando, salaId, criadoPorId });
  }

  async mover(
    id: string,
    input: MoverAlocacaoInput,
  ): Promise<AlocacaoAlterada> {
    await this.garantirCorrente(id);
    return this.alocacoes.mover(id, input);
  }

  async remover(id: string, versaoBase?: number): Promise<AlocacaoAlterada> {
    await this.garantirCorrente(id);
    return this.alocacoes.remover(id, versaoBase);
  }

  private async garantirCorrente(id: string): Promise<void> {
    const periodoId = await this.alocacoes.periodoDaAlocacao(id);
    if (!periodoId) {
      throw new NotFoundException(`Alocação ${id} não encontrada.`);
    }
    await this.periodoEditavel.garantir(periodoId);
  }
}
