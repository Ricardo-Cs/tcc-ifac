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

@Injectable()
export class PeriodosLetivosService {
  constructor(
    @Inject(PERIODO_LETIVO_REPOSITORY)
    private readonly periodos: PeriodoLetivoRepository,
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
    const periodo = await this.periodos.atualizar(id, input);
    if (!periodo) {
      throw new NotFoundException(`Período ${id} não encontrado.`);
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
