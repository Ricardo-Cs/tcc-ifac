import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import {
  AtualizarTurmaInput,
  CriarTurmaInput,
  Turma,
  TurmasRepository,
} from '@domain/academico/turma';
import { TurmaEntity } from '../../entities/academico/turma.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

/**
 * Adaptador TypeORM da porta `TurmasRepository`. O `cursoId` do modelo vira a
 * relação `curso` da entidade; a leitura traz o curso junto (relations) para o
 * registro plano carregar sigla/nome sem um segundo request.
 */
@Injectable()
export class TypeormTurmasRepository implements TurmasRepository {
  constructor(
    @InjectRepository(TurmaEntity)
    private readonly repo: Repository<TurmaEntity>,
  ) {}

  async listar(): Promise<Turma[]> {
    const linhas = await this.repo.find({
      relations: { curso: true },
      order: { nome: 'ASC' },
    });
    return linhas.map(toModel);
  }

  async buscarPorId(id: string): Promise<Turma | null> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: { curso: true },
    });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarTurmaInput): Promise<Turma> {
    try {
      const salvo = await this.repo.save(this.repo.create(toEntity(input)));
      return this.recarregar(salvo.id);
    } catch (erro) {
      throw traduzErro(erro, input.cursoId);
    }
  }

  async atualizar(
    id: string,
    input: AtualizarTurmaInput,
  ): Promise<Turma | null> {
    // preload carrega a turma e sobrepõe só os campos enviados; devolve
    // undefined quando o id não existe (vira 404 no serviço).
    const entidade = await this.repo.preload({ id, ...toEntity(input) });
    if (!entidade) {
      return null;
    }
    try {
      const salvo = await this.repo.save(entidade);
      return this.recarregar(salvo.id);
    } catch (erro) {
      throw traduzErro(erro, input.cursoId);
    }
  }

  async remover(id: string): Promise<boolean> {
    try {
      const resultado = await this.repo.delete({ id });
      return (resultado.affected ?? 0) > 0;
    } catch (erro) {
      if (isViolacaoChaveEstrangeira(erro)) {
        throw new ConflictException(
          'Turma está em uso (ofertas ou alocações) e não pode ser removida.',
        );
      }
      throw erro;
    }
  }

  /** Relê a turma com o curso resolvido para devolver o registro plano completo. */
  private async recarregar(id: string): Promise<Turma> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: { curso: true },
    });
    // A turma acabou de ser gravada nesta mesma transação lógica; sempre existe.
    return toModel(linha!);
  }
}

/** Converte os campos planos da aplicação para o shape de entidade (curso → relação). */
function toEntity(
  input: CriarTurmaInput | AtualizarTurmaInput,
): DeepPartial<TurmaEntity> {
  const { cursoId, ...resto } = input;
  return {
    ...resto,
    ...(cursoId ? { curso: { id: cursoId } } : {}),
  };
}

function traduzErro(erro: unknown, cursoId?: string): unknown {
  if (isViolacaoChaveEstrangeira(erro)) {
    return new BadRequestException(
      `Curso ${cursoId ?? ''} informado não existe.`.replace('  ', ' '),
    );
  }
  if (isViolacaoUnicidade(erro)) {
    return new ConflictException('Já existe uma turma com esses dados.');
  }
  return erro;
}

function toModel(e: TurmaEntity): Turma {
  return {
    id: e.id,
    cursoId: e.curso.id,
    cursoSigla: e.curso.sigla,
    cursoNome: e.curso.nome,
    nome: e.nome,
    semestreEntrada: e.semestreEntrada,
    quantidadeAlunos: e.quantidadeAlunos,
    ativa: e.ativa,
  };
}
