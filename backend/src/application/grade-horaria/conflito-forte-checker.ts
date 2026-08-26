import { Injectable } from '@nestjs/common';
import { SeveridadeConflito } from '@domain/grade-horaria/conflito';
import type { ConflitosPeriodoChecker } from '@domain/comum/trava-publicacao';
import { AvaliarGradeUseCase } from './avaliar-grade.use-case';

@Injectable()
export class AvaliarGradeConflitoForteChecker implements ConflitosPeriodoChecker {
  constructor(private readonly avaliarGrade: AvaliarGradeUseCase) {}

  async existeConflitoForte(periodoLetivoId: string): Promise<boolean> {
    const { conflitos } = await this.avaliarGrade.avaliar(periodoLetivoId);
    return conflitos.some((c) => c.severidade === SeveridadeConflito.FORTE);
  }
}
