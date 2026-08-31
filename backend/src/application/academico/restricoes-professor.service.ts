import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CriarRestricaoProfessorInput,
  RESTRICOES_PROFESSOR_REPOSITORY,
  RestricaoProfessor,
} from '@domain/academico/restricao-professor';
import type { RestricoesProfessorRepository } from '@domain/academico/restricao-professor';
import { COLETAS_RESTRICAO_REPOSITORY } from '@domain/academico/coleta-restricao';
import type { ColetasRestricaoRepository } from '@domain/academico/coleta-restricao';

export type CriarRestricaoProfessorServiceInput = Omit<
  CriarRestricaoProfessorInput,
  'coletaId'
>;

@Injectable()
export class RestricoesProfessorService {
  constructor(
    @Inject(RESTRICOES_PROFESSOR_REPOSITORY)
    private readonly restricoes: RestricoesProfessorRepository,
    @Inject(COLETAS_RESTRICAO_REPOSITORY)
    private readonly coletas: ColetasRestricaoRepository,
  ) {}

  listar(periodoLetivoId?: string): Promise<RestricaoProfessor[]> {
    return this.restricoes.listar(periodoLetivoId);
  }

  async criar(
    input: CriarRestricaoProfessorServiceInput,
  ): Promise<RestricaoProfessor> {
    const coleta = await this.coletas.buscarPorPeriodo(input.periodoLetivoId);
    if (!coleta) {
      throw new BadRequestException(
        'Não há coleta de restrições aberta para este período — crie a coleta antes de lançar restrições.',
      );
    }
    return this.restricoes.criar({ ...input, coletaId: coleta.id });
  }

  async remover(id: string): Promise<void> {
    const removido = await this.restricoes.remover(id);
    if (!removido) {
      throw new NotFoundException(`Restrição ${id} não encontrada.`);
    }
  }
}
