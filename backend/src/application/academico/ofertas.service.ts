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
} from '@domain/academico/oferta';
import type { OfertasRepository } from '@domain/academico/oferta';

@Injectable()
export class OfertasService {
  constructor(
    @Inject(OFERTAS_REPOSITORY)
    private readonly ofertas: OfertasRepository,
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

  criar(input: CriarOfertaInput): Promise<Oferta> {
    this.validarProporcoes(input.professores);
    return this.ofertas.criar(input);
  }

  async atualizar(id: string, input: AtualizarOfertaInput): Promise<Oferta> {
    // `professores` é opcional no PATCH; só valida quando o cliente o envia
    // (aí substitui o conjunto inteiro).
    if (input.professores !== undefined) {
      this.validarProporcoes(input.professores);
    }
    const oferta = await this.ofertas.atualizar(id, input);
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

  /** Traduz a regra de domínio da codocência em 400. */
  private validarProporcoes(
    professores: CriarOfertaInput['professores'],
  ): void {
    const erro = erroProporcoes(professores);
    if (erro) {
      throw new BadRequestException(erro);
    }
  }
}
