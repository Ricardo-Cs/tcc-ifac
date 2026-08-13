import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarDisciplinaInput,
  CriarDisciplinaInput,
  Disciplina,
  DisciplinasRepository,
} from '../../../../../application/academico/ports';
import { DisciplinaEntity } from '../../entities/academico/disciplina.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

/** Adaptador TypeORM da porta `DisciplinasRepository`. */
@Injectable()
export class TypeormDisciplinasRepository implements DisciplinasRepository {
  constructor(
    @InjectRepository(DisciplinaEntity)
    private readonly repo: Repository<DisciplinaEntity>,
  ) {}

  async listar(): Promise<Disciplina[]> {
    const linhas = await this.repo.find({ order: { codigo: 'ASC' } });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarDisciplinaInput): Promise<Disciplina> {
    try {
      const salvo = await this.repo.save(this.repo.create(input));
      return toModel(salvo);
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe uma disciplina com o código "${input.codigo}".`,
        );
      }
      throw erro;
    }
  }

  async atualizar(
    id: string,
    input: AtualizarDisciplinaInput,
  ): Promise<Disciplina | null> {
    const entidade = await this.repo.preload({ id, ...input });
    if (!entidade) {
      return null;
    }
    try {
      return toModel(await this.repo.save(entidade));
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe uma disciplina com o código "${input.codigo}".`,
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
          'Disciplina está em uso (ofertas ou matrizes) e não pode ser removida.',
        );
      }
      throw erro;
    }
  }
}

function toModel(e: DisciplinaEntity): Disciplina {
  return {
    id: e.id,
    codigo: e.codigo,
    nome: e.nome,
    cargaHoraria: e.cargaHoraria,
    tipoSalaRequerido: e.tipoSalaRequerido,
  };
}
