import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PROFESSORES_REPOSITORY,
  AtualizarProfessorInput,
  CriarProfessorInput,
  Professor,
} from './ports';
import type { ProfessoresRepository } from './ports';

@Injectable()
export class ProfessoresService {
  constructor(
    @Inject(PROFESSORES_REPOSITORY)
    private readonly professores: ProfessoresRepository,
  ) { }

  listar(): Promise<Professor[]> {
    return this.professores.listar();
  }

  async buscarPorId(id: string): Promise<Professor> {
    const professor = await this.professores.buscarPorId(id);
    if (!professor) {
      throw new NotFoundException(`Professor ${id} não encontrado.`);
    }
    return professor;
  }

  criar(input: CriarProfessorInput): Promise<Professor> {
    return this.professores.criar(input);
  }

  async atualizar(
    id: string,
    input: AtualizarProfessorInput,
  ): Promise<Professor> {
    const professor = await this.professores.atualizar(id, input);
    if (!professor) {
      throw new NotFoundException(`Professor ${id} não encontrado.`);
    }
    return professor;
  }

  async remover(id: string): Promise<void> {
    const removido = await this.professores.remover(id);
    if (!removido) {
      throw new NotFoundException(`Professor ${id} não encontrado.`);
    }
  }
}
