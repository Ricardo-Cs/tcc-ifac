import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import {
  AtualizarDisciplinaInput,
  CriarDisciplinaInput,
  Disciplina,
  DisciplinasRepository,
} from '@domain/academico/disciplina';
import { DisciplinaEntity } from '../../entities/academico/disciplina.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

@Injectable()
export class TypeormDisciplinasRepository implements DisciplinasRepository {
  constructor(
    @InjectRepository(DisciplinaEntity)
    private readonly repo: Repository<DisciplinaEntity>,
  ) {}

  async listar(): Promise<Disciplina[]> {
    const linhas = await this.repo.find({
      relations: { curso: true },
      order: { codigo: 'ASC' },
    });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: { curso: true },
    });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarDisciplinaInput): Promise<Disciplina> {
    try {
      const salvo = await this.repo.save(this.repo.create(toEntity(input)));
      return this.recarregar(salvo.id);
    } catch (erro) {
      throw traduzErro(erro, input);
    }
  }

  async atualizar(
    id: string,
    input: AtualizarDisciplinaInput,
  ): Promise<Disciplina | null> {
    const entidade = await this.repo.preload({ id, ...toEntity(input) });
    if (!entidade) {
      return null;
    }
    try {
      const salvo = await this.repo.save(entidade);
      return this.recarregar(salvo.id);
    } catch (erro) {
      throw traduzErro(erro, input);
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

  private async recarregar(id: string): Promise<Disciplina> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: { curso: true },
    });
    return toModel(linha!);
  }
}

function toEntity(
  input: CriarDisciplinaInput | AtualizarDisciplinaInput,
): DeepPartial<DisciplinaEntity> {
  const { cursoId, ...resto } = input;
  return {
    ...resto,
    ...(cursoId ? { curso: { id: cursoId } } : {}),
  };
}

function traduzErro(
  erro: unknown,
  input: CriarDisciplinaInput | AtualizarDisciplinaInput,
): unknown {
  if (isViolacaoChaveEstrangeira(erro)) {
    return new BadRequestException(
      `Curso ${input.cursoId ?? ''} informado não existe.`.replace('  ', ' '),
    );
  }
  if (isViolacaoUnicidade(erro)) {
    return new ConflictException(
      `Este curso já tem uma disciplina com o código "${input.codigo}".`,
    );
  }
  return erro;
}

function toModel(e: DisciplinaEntity): Disciplina {
  return {
    id: e.id,
    cursoId: e.curso.id,
    cursoSigla: e.curso.sigla,
    cursoNome: e.curso.nome,
    codigo: e.codigo,
    nome: e.nome,
    periodoCurso: e.periodoCurso,
    cargaHoraria: e.cargaHoraria,
    tipoSalaRequerido: e.tipoSalaRequerido,
  };
}
