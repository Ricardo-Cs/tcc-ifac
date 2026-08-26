import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  AtualizarPeriodoLetivoInput,
  CriarPeriodoLetivoInput,
  PeriodoLetivo,
  PeriodoLetivoRepository,
} from '@domain/comum/periodo-letivo';
import { PeriodoLetivoEntity } from '../../entities/comum/periodo-letivo.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

@Injectable()
export class TypeormPeriodosLetivosRepository implements PeriodoLetivoRepository {
  constructor(
    @InjectRepository(PeriodoLetivoEntity)
    private readonly repo: Repository<PeriodoLetivoEntity>,
  ) {}

  async listar(): Promise<PeriodoLetivo[]> {
    const linhas = await this.repo.find({
      order: { ano: 'DESC', semestre: 'DESC' },
    });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<PeriodoLetivo | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarPeriodoLetivoInput): Promise<PeriodoLetivo> {
    try {
      return await this.repo.manager.transaction(async (manager) => {
        if (input.ativo) {
          await desmarcarAtivos(manager);
        }
        const entidade = manager.create(PeriodoLetivoEntity, {
          ...input,
          codigo: codigoDe(input.ano, input.semestre),
        });
        return toModel(await manager.save(entidade));
      });
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um período para ${codigoDe(input.ano, input.semestre)}.`,
        );
      }
      throw erro;
    }
  }

  async atualizar(
    id: string,
    input: AtualizarPeriodoLetivoInput,
  ): Promise<PeriodoLetivo | null> {
    try {
      return await this.repo.manager.transaction(async (manager) => {
        const entidade = await manager.preload(PeriodoLetivoEntity, {
          id,
          ...input,
        });
        if (!entidade) {
          return null;
        }
        entidade.codigo = codigoDe(entidade.ano, entidade.semestre);
        if (input.ativo) {
          await desmarcarAtivos(manager, id);
        }
        return toModel(await manager.save(entidade));
      });
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          'Já existe um período para esse ano e semestre.',
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
          'Período em uso (ofertas, restrições ou alocações) e não pode ser removido.',
        );
      }
      throw erro;
    }
  }
}

function desmarcarAtivos(
  manager: EntityManager,
  excetoId?: string,
): Promise<unknown> {
  const qb = manager
    .createQueryBuilder()
    .update(PeriodoLetivoEntity)
    .set({ ativo: false })
    .where('ativo = true');
  if (excetoId) {
    qb.andWhere('id != :excetoId', { excetoId });
  }
  return qb.execute();
}

function codigoDe(ano: number, semestre: number): string {
  return `${ano}.${semestre}`;
}

function toModel(e: PeriodoLetivoEntity): PeriodoLetivo {
  return {
    id: e.id,
    codigo: e.codigo,
    ano: e.ano,
    semestre: e.semestre,
    descricao: e.descricao,
    dataInicio: e.dataInicio,
    dataFim: e.dataFim,
    ativo: e.ativo,
    status: e.status,
  };
}
