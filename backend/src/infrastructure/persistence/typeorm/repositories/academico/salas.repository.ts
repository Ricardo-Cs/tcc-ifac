import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarSalaInput,
  CriarSalaInput,
  Sala,
  SalasRepository,
} from '@domain/academico/sala';
import { SalaEntity } from '../../entities/academico/sala.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

/**
 * Adaptador TypeORM da porta `SalasRepository`. Mapeia a entidade para o
 * registro plano da aplicação (`Sala`) — a aplicação não conhece a entidade.
 */
@Injectable()
export class TypeormSalasRepository implements SalasRepository {
  constructor(
    @InjectRepository(SalaEntity)
    private readonly repo: Repository<SalaEntity>,
  ) {}

  async listar(): Promise<Sala[]> {
    const linhas = await this.repo.find({ order: { nome: 'ASC' } });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Sala | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarSalaInput): Promise<Sala> {
    try {
      const salvo = await this.repo.save(this.repo.create(input));
      return toModel(salvo);
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe uma sala com o nome "${input.nome}".`,
        );
      }
      throw erro;
    }
  }

  async atualizar(id: string, input: AtualizarSalaInput): Promise<Sala | null> {
    // preload carrega a sala do banco e sobrepõe só os campos enviados;
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
          `Já existe uma sala com o nome "${input.nome}".`,
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
          'Sala está em uso (alocações) e não pode ser removida.',
        );
      }
      throw erro;
    }
  }
}

function toModel(e: SalaEntity): Sala {
  return {
    id: e.id,
    nome: e.nome,
    tipo: e.tipo,
    capacidade: e.capacidade,
    ativa: e.ativa,
  };
}
