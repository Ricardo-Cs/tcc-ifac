import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarProfessorInput,
  CriarProfessorInput,
  Professor,
  ProfessoresRepository,
} from '@domain/academico/professor';
import { ProfessorEntity } from '../../entities/academico/professor.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

/** Adaptador TypeORM da porta `ProfessoresRepository`. */
@Injectable()
export class TypeormProfessoresRepository implements ProfessoresRepository {
  constructor(
    @InjectRepository(ProfessorEntity)
    private readonly repo: Repository<ProfessorEntity>,
  ) {}

  async listar(): Promise<Professor[]> {
    const linhas = await this.repo.find({ order: { nome: 'ASC' } });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Professor | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarProfessorInput): Promise<Professor> {
    try {
      const salvo = await this.repo.save(this.repo.create(input));
      return toModel(salvo);
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um professor com o SIAPE "${input.siape}".`,
        );
      }
      throw erro;
    }
  }

  async atualizar(
    id: string,
    input: AtualizarProfessorInput,
  ): Promise<Professor | null> {
    const entidade = await this.repo.preload({ id, ...input });
    if (!entidade) {
      return null;
    }
    try {
      return toModel(await this.repo.save(entidade));
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um professor com o SIAPE "${input.siape}".`,
        );
      }
      throw erro;
    }
  }

  async remover(id: string): Promise<boolean> {
    try {
      const resultado = await this.repo.delete({ id });
      return (resultado.affected ?? 0) > 0;
    } catch (erro) {
      if (isViolacaoChaveEstrangeira(erro)) {
        throw new ConflictException(
          'Professor está em uso (ofertas ou restrições) e não pode ser removido.',
        );
      }
      throw erro;
    }
  }
}

function toModel(e: ProfessorEntity): Professor {
  return {
    id: e.id,
    nome: e.nome,
    email: e.email,
    siape: e.siape,
    titulacao: e.titulacao,
    grupoRegime: e.grupoRegime,
    ajusteCargaHoras: e.ajusteCargaHoras,
    ajusteCargaMotivo: e.ajusteCargaMotivo,
    ativo: e.ativo,
  };
}
