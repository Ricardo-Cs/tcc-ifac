import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TURMAS_REPOSITORY,
  AtualizarTurmaInput,
  CriarTurmaInput,
  Turma,
} from '@domain/academico/turma';
import type { TurmasRepository } from '@domain/academico/turma';

@Injectable()
export class TurmasService {
  constructor(
    @Inject(TURMAS_REPOSITORY)
    private readonly turmas: TurmasRepository,
  ) {}

  listar(): Promise<Turma[]> {
    return this.turmas.listar();
  }

  async buscarPorId(id: string): Promise<Turma> {
    const turma = await this.turmas.buscarPorId(id);
    if (!turma) {
      throw new NotFoundException(`Turma ${id} não encontrada.`);
    }
    return turma;
  }

  criar(input: CriarTurmaInput): Promise<Turma> {
    return this.turmas.criar(input);
  }

  async atualizar(id: string, input: AtualizarTurmaInput): Promise<Turma> {
    const turma = await this.turmas.atualizar(id, input);
    if (!turma) {
      throw new NotFoundException(`Turma ${id} não encontrada.`);
    }
    return turma;
  }

  async remover(id: string): Promise<void> {
    const removida = await this.turmas.remover(id);
    if (!removida) {
      throw new NotFoundException(`Turma ${id} não encontrada.`);
    }
  }
}
