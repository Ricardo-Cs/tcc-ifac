import { Inject, Injectable } from '@nestjs/common';
import {
  ALOCACOES_REPOSITORY,
  GERADOR_GRADE_INICIAL,
} from '@domain/grade-horaria/ports';
import type {
  AlocacoesRepository,
  GeradorGradeInicial,
} from '@domain/grade-horaria/ports';
import { AvaliarGradeUseCase } from './avaliar-grade.use-case';
import { PeriodoEditavelGuard } from './periodo-editavel.guard';

export interface ResultadoGeracaoInicial {
  criadas: number;
}

/**
 * Orquestra o rascunho inicial: reusa a mesma avaliação de snapshot do resto
 * do motor, delega a proposta ao `GeradorGradeInicial` injetado (ver
 * `ports.ts` — trocar de algoritmo é trocar o provider no módulo, sem tocar
 * aqui) e grava cada alocação pela mesma porta que o arrasto manual usa — o
 * resultado é indistinguível de alocações criadas à mão, sem tratamento
 * especial.
 */
@Injectable()
export class GerarGradeInicialUseCase {
  constructor(
    private readonly avaliarGrade: AvaliarGradeUseCase,
    @Inject(ALOCACOES_REPOSITORY)
    private readonly alocacoes: AlocacoesRepository,
    @Inject(GERADOR_GRADE_INICIAL)
    private readonly gerador: GeradorGradeInicial,
    private readonly periodoEditavel: PeriodoEditavelGuard,
  ) {}

  async executar(
    periodoLetivoId: string,
    criadoPorId: string,
  ): Promise<ResultadoGeracaoInicial> {
    await this.periodoEditavel.garantir(periodoLetivoId);

    const { snapshot } = await this.avaliarGrade.avaliar(periodoLetivoId);
    const propostas = this.gerador.gerar(snapshot);

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
