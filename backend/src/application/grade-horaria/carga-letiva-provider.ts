import { Inject, Injectable } from '@nestjs/common';
import { construirSnapshot } from '@domain/grade-horaria/construir-snapshot';
import { cargaLetivaPorProfessor } from '@domain/grade-horaria/carga-letiva';
import {
  PERIODOS_REPOSITORY,
  SNAPSHOT_LOADER,
} from '@domain/grade-horaria/ports';
import type {
  PeriodosRepository,
  SnapshotLoader,
} from '@domain/grade-horaria/ports';
import type { CargaLetivaProvider } from '@domain/academico/carga-letiva';

@Injectable()
export class SnapshotCargaLetivaProvider implements CargaLetivaProvider {
  constructor(
    @Inject(SNAPSHOT_LOADER) private readonly loader: SnapshotLoader,
    @Inject(PERIODOS_REPOSITORY) private readonly periodos: PeriodosRepository,
  ) {}

  async cargaAtualPorProfessor(): Promise<Map<string, number>> {
    const periodoId = await this.periodos.ativoId();
    if (!periodoId) return new Map();
    const dados = await this.loader.carregar(periodoId);
    return cargaLetivaPorProfessor(construirSnapshot(dados));
  }
}
