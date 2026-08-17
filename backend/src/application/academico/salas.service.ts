import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SALAS_REPOSITORY,
  AtualizarSalaInput,
  CriarSalaInput,
  Sala,
} from '@domain/academico/sala';
import type { SalasRepository } from '@domain/academico/sala';

@Injectable()
export class SalasService {
  constructor(
    @Inject(SALAS_REPOSITORY)
    private readonly salas: SalasRepository,
  ) {}

  listar(): Promise<Sala[]> {
    return this.salas.listar();
  }

  async buscarPorId(id: string): Promise<Sala> {
    const sala = await this.salas.buscarPorId(id);
    if (!sala) {
      throw new NotFoundException(`Sala ${id} não encontrada.`);
    }
    return sala;
  }

  criar(input: CriarSalaInput): Promise<Sala> {
    return this.salas.criar(input);
  }

  async atualizar(id: string, input: AtualizarSalaInput): Promise<Sala> {
    const sala = await this.salas.atualizar(id, input);
    if (!sala) {
      throw new NotFoundException(`Sala ${id} não encontrada.`);
    }
    return sala;
  }

  async remover(id: string): Promise<void> {
    const removida = await this.salas.remover(id);
    if (!removida) {
      throw new NotFoundException(`Sala ${id} não encontrada.`);
    }
  }
}
