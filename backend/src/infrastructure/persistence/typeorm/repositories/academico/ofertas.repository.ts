import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import {
  AtualizarOfertaInput,
  CriarOfertaInput,
  Oferta,
  OfertasRepository,
  ProfessorOfertaInput,
} from '@domain/academico/oferta';
import { OfertaDisciplinaEntity } from '../../entities/academico/oferta-disciplina.entity';
import { ProfessorOfertaEntity } from '../../entities/academico/professor-oferta.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

const RELACOES = {
  turma: { curso: true },
  disciplina: true,
  periodoLetivo: true,
  sala: true,
} as const;

@Injectable()
export class TypeormOfertasRepository implements OfertasRepository {
  constructor(
    @InjectRepository(OfertaDisciplinaEntity)
    private readonly ofertas: Repository<OfertaDisciplinaEntity>,
    @InjectRepository(ProfessorOfertaEntity)
    private readonly vinculos: Repository<ProfessorOfertaEntity>,
  ) {}

  async listar(periodoLetivoId?: string): Promise<Oferta[]> {
    const linhas = await this.ofertas.find({
      where: periodoLetivoId ? { periodoLetivo: { id: periodoLetivoId } } : {},
      relations: RELACOES,
    });
    const porOferta = await this.vinculosPorOferta(linhas.map((o) => o.id));
    return linhas
      .map((o) => toModel(o, porOferta.get(o.id) ?? []))
      .sort(ordenar);
  }

  async buscarPorId(id: string): Promise<Oferta | null> {
    const linha = await this.ofertas.findOne({
      where: { id },
      relations: RELACOES,
    });
    if (!linha) {
      return null;
    }
    const porOferta = await this.vinculosPorOferta([id]);
    return toModel(linha, porOferta.get(id) ?? []);
  }

  async criar(input: CriarOfertaInput): Promise<Oferta> {
    try {
      const id = await this.ofertas.manager.transaction(async (em) => {
        const oferta = await em.save(
          em.create(OfertaDisciplinaEntity, {
            turma: { id: input.turmaId },
            disciplina: { id: input.disciplinaId },
            periodoLetivo: { id: input.periodoLetivoId },
            regime: input.regime,
            aulasSemana: input.aulasSemana,
            sala: input.salaId ? { id: input.salaId } : null,
            observacoes: input.observacoes ?? null,
          }),
        );
        await this.gravarVinculos(em, oferta.id, input.professores);
        return oferta.id;
      });
      return this.exigirPorId(id);
    } catch (erro) {
      throw traduzErro(erro);
    }
  }

  async atualizar(
    id: string,
    input: AtualizarOfertaInput,
  ): Promise<Oferta | null> {
    const existe = await this.ofertas.findOneBy({ id });
    if (!existe) {
      return null;
    }
    try {
      await this.ofertas.manager.transaction(async (em) => {
        const entidade = await em.preload(OfertaDisciplinaEntity, {
          id,
          ...(input.turmaId ? { turma: { id: input.turmaId } } : {}),
          ...(input.disciplinaId
            ? { disciplina: { id: input.disciplinaId } }
            : {}),
          ...(input.periodoLetivoId
            ? { periodoLetivo: { id: input.periodoLetivoId } }
            : {}),
          ...(input.regime ? { regime: input.regime } : {}),
          ...(input.aulasSemana !== undefined
            ? { aulasSemana: input.aulasSemana }
            : {}),
          ...(input.salaId !== undefined
            ? { sala: input.salaId ? { id: input.salaId } : null }
            : {}),
          ...(input.observacoes !== undefined
            ? { observacoes: input.observacoes }
            : {}),
        });
        if (entidade) {
          await em.save(entidade);
        }
        if (input.professores !== undefined) {
          await em.delete(ProfessorOfertaEntity, { oferta: { id } });
          await this.gravarVinculos(em, id, input.professores);
        }
      });
      return this.exigirPorId(id);
    } catch (erro) {
      throw traduzErro(erro);
    }
  }

  async remover(id: string): Promise<boolean> {
    const resultado = await this.ofertas.delete({ id });
    return (resultado.affected ?? 0) > 0;
  }

  private async gravarVinculos(
    em: EntityManager,
    ofertaId: string,
    professores: ProfessorOfertaInput[],
  ): Promise<void> {
    if (professores.length === 0) {
      return;
    }
    const linhas = professores.map((p) =>
      em.create(ProfessorOfertaEntity, {
        oferta: { id: ofertaId },
        professor: { id: p.professorId },
        proporcaoCarga: p.proporcaoCarga,
      }),
    );
    await em.save(linhas);
  }

  private async vinculosPorOferta(
    ids: string[],
  ): Promise<Map<string, ProfessorOfertaEntity[]>> {
    const mapa = new Map<string, ProfessorOfertaEntity[]>();
    if (ids.length === 0) {
      return mapa;
    }
    const linhas = await this.vinculos.find({
      where: { oferta: { id: In(ids) } },
      relations: { professor: true, oferta: true },
    });
    for (const v of linhas) {
      const lista = mapa.get(v.oferta.id) ?? [];
      lista.push(v);
      mapa.set(v.oferta.id, lista);
    }
    return mapa;
  }

  private async exigirPorId(id: string): Promise<Oferta> {
    const oferta = await this.buscarPorId(id);
    return oferta!;
  }
}

function traduzErro(erro: unknown): unknown {
  if (isViolacaoUnicidade(erro)) {
    return new ConflictException(
      'Já existe uma oferta dessa disciplina para essa turma neste período.',
    );
  }
  if (isViolacaoChaveEstrangeira(erro)) {
    return new BadRequestException(
      'Turma, disciplina, período, sala ou professor informado não existe.',
    );
  }
  return erro;
}

function ordenar(a: Oferta, b: Oferta): number {
  return (
    a.turmaNome.localeCompare(b.turmaNome) ||
    a.disciplinaCodigo.localeCompare(b.disciplinaCodigo)
  );
}

function toModel(
  o: OfertaDisciplinaEntity,
  vinculos: ProfessorOfertaEntity[],
): Oferta {
  return {
    id: o.id,
    turmaId: o.turma.id,
    turmaNome: o.turma.nome,
    cursoSigla: o.turma.curso.sigla,
    cursoNome: o.turma.curso.nome,
    disciplinaId: o.disciplina.id,
    disciplinaCodigo: o.disciplina.codigo,
    disciplinaNome: o.disciplina.nome,
    periodoLetivoId: o.periodoLetivo.id,
    periodoCodigo: o.periodoLetivo.codigo,
    regime: o.regime,
    aulasSemana: o.aulasSemana,
    salaId: o.sala?.id ?? null,
    salaNome: o.sala?.nome ?? null,
    observacoes: o.observacoes,
    professores: vinculos.map((v) => ({
      professorId: v.professor.id,
      professorNome: v.professor.nome,
      proporcaoCarga: v.proporcaoCarga,
    })),
  };
}
