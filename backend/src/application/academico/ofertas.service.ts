import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OFERTAS_REPOSITORY,
  AtualizarOfertaInput,
  CriarOfertaInput,
  Oferta,
  erroProporcoes,
  regimeDaModalidade,
} from '@domain/academico/oferta';
import type { OfertasRepository } from '@domain/academico/oferta';
import { TURMAS_REPOSITORY } from '@domain/academico/turma';
import type { TurmasRepository } from '@domain/academico/turma';
import { RegimeOferta } from '@domain/academico/enums';

export type CriarOfertaEntrada = Omit<CriarOfertaInput, 'regime'>;
export type AtualizarOfertaEntrada = Omit<AtualizarOfertaInput, 'regime'>;

@Injectable()
export class OfertasService {
  constructor(
    @Inject(OFERTAS_REPOSITORY)
    private readonly ofertas: OfertasRepository,
    @Inject(TURMAS_REPOSITORY)
    private readonly turmas: TurmasRepository,
  ) {}

  listar(periodoLetivoId?: string): Promise<Oferta[]> {
    return this.ofertas.listar(periodoLetivoId);
  }

  async buscarPorId(id: string): Promise<Oferta> {
    const oferta = await this.ofertas.buscarPorId(id);
    if (!oferta) {
      throw new NotFoundException(`Oferta ${id} não encontrada.`);
    }
    return oferta;
  }

  async criar(input: CriarOfertaEntrada): Promise<Oferta> {
    this.validarProporcoes(input.professores);
    const regime = await this.regimeDaTurma(input.turmaId);
    return this.ofertas.criar({ ...input, regime });
  }

  async atualizar(id: string, input: AtualizarOfertaEntrada): Promise<Oferta> {
    if (input.professores !== undefined) {
      this.validarProporcoes(input.professores);
    }
    const regime = input.turmaId
      ? await this.regimeDaTurma(input.turmaId)
      : undefined;
    const oferta = await this.ofertas.atualizar(id, {
      ...input,
      ...(regime ? { regime } : {}),
    });
    if (!oferta) {
      throw new NotFoundException(`Oferta ${id} não encontrada.`);
    }
    return oferta;
  }

  async remover(id: string): Promise<void> {
    const removida = await this.ofertas.remover(id);
    if (!removida) {
      throw new NotFoundException(`Oferta ${id} não encontrada.`);
    }
  }

  private async regimeDaTurma(turmaId: string): Promise<RegimeOferta> {
    const turma = await this.turmas.buscarPorId(turmaId);
    if (!turma) {
      throw new BadRequestException(`Turma ${turmaId} informada não existe.`);
    }
    return regimeDaModalidade(turma.cursoModalidade);
  }

  private validarProporcoes(
    professores: CriarOfertaInput['professores'],
  ): void {
    const erro = erroProporcoes(professores);
    if (erro) {
      throw new BadRequestException(erro);
    }
  }
}
