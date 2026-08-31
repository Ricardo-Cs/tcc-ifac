import { Inject, Injectable } from '@nestjs/common';
import { ALOCACOES_REPOSITORY } from '@domain/grade-horaria/ports';
import type { AlocacoesRepository } from '@domain/grade-horaria/ports';
import { gerarGradeInicial } from '@domain/grade-horaria/gerar-grade-inicial';
import { AvaliarGradeUseCase } from './avaliar-grade.use-case';
import { PeriodoEditavelGuard } from './periodo-editavel.guard';

export interface ResultadoGeracaoInicial {
  criadas: number;
}

/**
 * Orquestra o rascunho inicial (ver `gerarGradeInicial`, no domínio): reusa a
 * mesma avaliação de snapshot do resto do motor, propõe as alocações e grava
 * cada uma pela mesma porta que o arrasto manual usa — o resultado é
 * indistinguível de alocações criadas à mão, sem tratamento especial.
 */
@Injectable()
export class GerarGradeInicialUseCase {
  constructor(
    private readonly avaliarGrade: AvaliarGradeUseCase,
    @Inject(ALOCACOES_REPOSITORY)
    private readonly alocacoes: AlocacoesRepository,
    private readonly periodoEditavel: PeriodoEditavelGuard,
  ) {}

  async executar(
    periodoLetivoId: string,
    criadoPorId: string,
  ): Promise<ResultadoGeracaoInicial> {
    await this.periodoEditavel.garantir(periodoLetivoId);

    const { snapshot } = await this.avaliarGrade.avaliar(periodoLetivoId);
    const propostas = gerarGradeInicial(snapshot);

    for (const proposta of propostas) {
      await this.alocacoes.criar({
        ofertaId: proposta.ofertaId,
        slotHorarioId: proposta.slotHorarioId,
        criadoPorId,
      });
    }

    return { criadas: propostas.length };
  }
}
