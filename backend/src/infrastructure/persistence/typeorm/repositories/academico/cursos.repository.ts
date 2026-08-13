import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarCursoInput,
  CriarCursoInput,
  Curso,
  CursosRepository,
} from '../../../../../application/academico/ports';
import { CursoEntity } from '../../entities/academico/curso.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

/**
 * Adaptador TypeORM da porta `CursosRepository`. Mapeia a entidade para o
 * registro plano da aplicação (`Curso`) — a aplicação não conhece a entidade.
 */
@Injectable()
export class TypeormCursosRepository implements CursosRepository {
  constructor(
    @InjectRepository(CursoEntity)
    private readonly repo: Repository<CursoEntity>,
  ) {}

  async listar(): Promise<Curso[]> {
    const linhas = await this.repo.find({ order: { sigla: 'ASC' } });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Curso | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarCursoInput): Promise<Curso> {
    try {
      const salvo = await this.repo.save(this.repo.create(input));
      return toModel(salvo);
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um curso com a sigla "${input.sigla}".`,
        );
      }
      throw erro;
    }
  }

  async atualizar(
    id: string,
    input: AtualizarCursoInput,
  ): Promise<Curso | null> {
    // preload carrega o curso do banco e sobrepõe só os campos enviados;
    // devolve undefined quando o id não existe (vira 404 no serviço).
    const entidade = await this.repo.preload({ id, ...input });
    if (!entidade) {
      return null;
    }
    try {
      return toModel(await this.repo.save(entidade));
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um curso com a sigla "${input.sigla}".`,
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
          'Curso está em uso (turmas ou ofertas) e não pode ser removido.',
        );
      }
      throw erro;
    }
  }
}

function toModel(e: CursoEntity): Curso {
  return {
    id: e.id,
    nome: e.nome,
    sigla: e.sigla,
    modalidade: e.modalidade,
    turnoPadrao: e.turnoPadrao,
    cargaHoraria: e.cargaHoraria,
    ativo: e.ativo,
  };
}
