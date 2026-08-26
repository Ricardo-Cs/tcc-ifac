import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PROFESSORES_REPOSITORY,
  AtualizarProfessorInput,
  CriarProfessorInput,
  Professor,
} from '@domain/academico/professor';
import type { ProfessoresRepository } from '@domain/academico/professor';
import { CARGA_LETIVA_PROVIDER } from '@domain/academico/carga-letiva';
import type { CargaLetivaProvider } from '@domain/academico/carga-letiva';

@Injectable()
export class ProfessoresService {
  constructor(
    @Inject(PROFESSORES_REPOSITORY)
    private readonly professores: ProfessoresRepository,
    @Inject(CARGA_LETIVA_PROVIDER)
    private readonly cargaLetiva: CargaLetivaProvider,
  ) {}

  async listar(): Promise<Array<Professor & { cargaHorariaAtual: number }>> {
    const [professores, carga] = await Promise.all([
      this.professores.listar(),
      this.cargaLetiva.cargaAtualPorProfessor(),
    ]);
    return professores.map((professor) => ({
      ...professor,
      cargaHorariaAtual: carga.get(professor.id) ?? 0,
    }));
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
