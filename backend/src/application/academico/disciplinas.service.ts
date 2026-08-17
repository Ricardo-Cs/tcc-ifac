import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DISCIPLINAS_REPOSITORY,
  AtualizarDisciplinaInput,
  CriarDisciplinaInput,
  Disciplina,
} from '@domain/academico/disciplina';
import type { DisciplinasRepository } from '@domain/academico/disciplina';

@Injectable()
export class DisciplinasService {
  constructor(
    @Inject(DISCIPLINAS_REPOSITORY)
    private readonly disciplinas: DisciplinasRepository,
  ) {}

  listar(): Promise<Disciplina[]> {
    return this.disciplinas.listar();
  }

  async buscarPorId(id: string): Promise<Disciplina> {
    const disciplina = await this.disciplinas.buscarPorId(id);
    if (!disciplina) {
      throw new NotFoundException(`Disciplina ${id} não encontrada.`);
    }
    return disciplina;
  }

  criar(input: CriarDisciplinaInput): Promise<Disciplina> {
    return this.disciplinas.criar(input);
  }

  async atualizar(
    id: string,
    input: AtualizarDisciplinaInput,
  ): Promise<Disciplina> {
    const disciplina = await this.disciplinas.atualizar(id, input);
    if (!disciplina) {
      throw new NotFoundException(`Disciplina ${id} não encontrada.`);
    }
    return disciplina;
  }

  async remover(id: string): Promise<void> {
    const removido = await this.disciplinas.remover(id);
    if (!removido) {
      throw new NotFoundException(`Disciplina ${id} não encontrada.`);
    }
  }
}
