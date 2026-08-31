import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CriarRestricaoProfessorInput,
  RestricaoProfessor,
  RestricoesProfessorRepository,
} from '@domain/academico/restricao-professor';
import { RestricaoProfessorEntity } from '../../entities/academico/restricao-professor.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

const RELACOES = {
  professor: true,
  slotHorario: true,
  periodoLetivo: true,
  coleta: true,
} as const;

@Injectable()
export class TypeormRestricoesProfessorRepository implements RestricoesProfessorRepository {
  constructor(
    @InjectRepository(RestricaoProfessorEntity)
    private readonly repo: Repository<RestricaoProfessorEntity>,
  ) {}

  async listar(periodoLetivoId?: string): Promise<RestricaoProfessor[]> {
    const linhas = await this.repo.find({
      where: periodoLetivoId ? { periodoLetivo: { id: periodoLetivoId } } : {},
      relations: RELACOES,
    });
    return linhas.map(toModel);
  }

  async criar(
    input: CriarRestricaoProfessorInput,
  ): Promise<RestricaoProfessor> {
    try {
      const salvo = await this.repo.save(
        this.repo.create({
          professor: { id: input.professorId },
          slotHorario: { id: input.slotHorarioId },
          periodoLetivo: { id: input.periodoLetivoId },
          coleta: { id: input.coletaId },
          motivo: input.motivo ?? null,
          amparoLegal: input.amparoLegal ?? false,
        }),
      );
      return this.recarregar(salvo.id);
    } catch (erro) {
      if (isViolacaoChaveEstrangeira(erro)) {
        throw new BadRequestException(
          'Professor, slot horário ou período informado não existe.',
        );
      }
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          'Este professor já tem restrição lançada para este horário no período.',
        );
      }
      throw erro;
    }
  }

  async remover(id: string): Promise<boolean> {
    const resultado = await this.repo.delete({ id });
    return (resultado.affected ?? 0) > 0;
  }

  private async recarregar(id: string): Promise<RestricaoProfessor> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: RELACOES,
    });
    return toModel(linha!);
  }
}

function toModel(e: RestricaoProfessorEntity): RestricaoProfessor {
  return {
    id: e.id,
    professorId: e.professor.id,
    professorNome: e.professor.nome,
    slotHorarioId: e.slotHorario.id,
    slotHorarioCodigo: e.slotHorario.codigo,
    periodoLetivoId: e.periodoLetivo.id,
    coletaId: e.coleta.id,
    motivo: e.motivo,
    amparoLegal: e.amparoLegal,
  };
}
