import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CURSOS_REPOSITORY,
  AtualizarCursoInput,
  CriarCursoInput,
  Curso,
} from './ports';
import type { CursosRepository } from './ports';

@Injectable()
export class CursosService {
  constructor(
    @Inject(CURSOS_REPOSITORY)
    private readonly cursos: CursosRepository,
  ) { }

  listar(): Promise<Curso[]> {
    return this.cursos.listar();
  }

  async buscarPorId(id: string): Promise<Curso> {
    const curso = await this.cursos.buscarPorId(id);
    if (!curso) {
      throw new NotFoundException(`Curso ${id} não encontrado.`);
    }
    return curso;
  }

  criar(input: CriarCursoInput): Promise<Curso> {
    return this.cursos.criar(input);
  }

  async atualizar(id: string, input: AtualizarCursoInput): Promise<Curso> {
    const curso = await this.cursos.atualizar(id, input);
    if (!curso) {
      throw new NotFoundException(`Curso ${id} não encontrado.`);
    }
    return curso;
  }

  async remover(id: string): Promise<void> {
    const removido = await this.cursos.remover(id);
    if (!removido) {
      throw new NotFoundException(`Curso ${id} não encontrado.`);
    }
  }
}
