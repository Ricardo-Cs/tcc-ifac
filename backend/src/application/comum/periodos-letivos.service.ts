import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AtualizarPeriodoLetivoInput,
  CriarPeriodoLetivoInput,
  PERIODO_LETIVO_REPOSITORY,
  PeriodoLetivo,
} from '@domain/comum/periodo-letivo';
import type { PeriodoLetivoRepository } from '@domain/comum/periodo-letivo';
import { StatusPeriodo } from '@domain/comum/enums';
import { AvaliarGradeUseCase } from '@application/grade-horaria/avaliar-grade.use-case';
import { montarGradeView } from '@application/grade-horaria/grade-view';
import { TravaPublicacaoGuard } from './trava-publicacao.guard';

@Injectable()
export class PeriodosLetivosService {
  constructor(
    @Inject(PERIODO_LETIVO_REPOSITORY)
    private readonly periodos: PeriodoLetivoRepository,
    private readonly travaPublicacao: TravaPublicacaoGuard,
    private readonly avaliarGrade: AvaliarGradeUseCase,
  ) {}

  listar(): Promise<PeriodoLetivo[]> {
    return this.periodos.listar();
  }

  async buscarPorId(id: string): Promise<PeriodoLetivo> {
    const periodo = await this.periodos.buscarPorId(id);
    if (!periodo) {
      throw new NotFoundException(`Período ${id} não encontrado.`);
    }
    return periodo;
  }

  criar(input: CriarPeriodoLetivoInput): Promise<PeriodoLetivo> {
    return this.periodos.criar(input);
  }

  async atualizar(
    id: string,
    input: AtualizarPeriodoLetivoInput,
  ): Promise<PeriodoLetivo> {
    const estaPublicando = input.status === StatusPeriodo.PUBLICADO;
    let snapshotGrade: Record<string, unknown> | null = null;
    if (estaPublicando) {
      await this.travaPublicacao.garantir(id);
      const resultado = await this.avaliarGrade.avaliar(id);
      snapshotGrade = montarGradeView(resultado) as unknown as Record<
        string,
        unknown
      >;
    }
    const periodo = await this.periodos.atualizar(id, input);
    if (!periodo) {
      throw new NotFoundException(`Período ${id} não encontrado.`);
    }
    if (snapshotGrade) {
      await this.periodos.gravarGradePublicada(id, snapshotGrade);
    }
    return periodo;
  }

  async remover(id: string): Promise<void> {
    const periodo = await this.buscarPorId(id);
    if (periodo.ativo) {
      throw new ConflictException(
        'Este é o período corrente. Defina outro período como corrente antes de remover este.',
      );
    }
    const removido = await this.periodos.remover(id);
    if (!removido) {
      throw new NotFoundException(`Período ${id} não encontrado.`);
    }
  }
}
