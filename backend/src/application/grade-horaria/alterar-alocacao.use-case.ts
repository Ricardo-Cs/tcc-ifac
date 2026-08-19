import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ALOCACOES_REPOSITORY,
  AlocacaoAlterada,
  MoverAlocacaoInput,
  USUARIOS_REPOSITORY,
} from '@domain/grade-horaria/ports';
import type {
  AlocacoesRepository,
  CriarAlocacaoInput,
  UsuariosRepository,
} from '@domain/grade-horaria/ports';
import { PeriodoEditavelGuard } from './periodo-editavel.guard';

/** O que o cliente envia para criar uma aula — sem o autor, resolvido aqui. */
export type NovaAlocacao = Omit<CriarAlocacaoInput, 'criadoPorId'>;

/**
 * Escrita de alocações. Chronos NÃO bloqueia alocação conflitante — registra o
 * que a comissão decidir e deixa o motor sinalizar. Por isso não há validação de
 * conflito aqui: criar/mover uma aula é sempre permitido; o recálculo (feito
 * pelo controller após a escrita) é que mostra o que acendeu.
 */
@Injectable()
export class AlterarAlocacaoUseCase {
  constructor(
    @Inject(ALOCACOES_REPOSITORY)
    private readonly alocacoes: AlocacoesRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuarios: UsuariosRepository,
    private readonly periodoEditavel: PeriodoEditavelGuard,
  ) {}

  async criar(comando: NovaAlocacao): Promise<AlocacaoAlterada> {
    // Trava de escrita ANTES de inserir: resolve o período pela oferta e recusa
    // se não for o corrente. `null` = oferta inexistente, mesmo 404 do INSERT.
    const periodoId = await this.alocacoes.periodoDaOferta(comando.ofertaId);
    if (!periodoId) {
      throw new NotFoundException(`Oferta ${comando.ofertaId} não encontrada.`);
    }
    await this.periodoEditavel.garantir(periodoId);

    const criadoPorId = await this.usuarios.padraoId();
    if (!criadoPorId) {
      throw new ServiceUnavailableException(
        'Nenhum usuário disponível para registrar a alocação.',
      );
    }
    return this.alocacoes.criar({ ...comando, criadoPorId });
  }

  async mover(
    id: string,
    input: MoverAlocacaoInput,
  ): Promise<AlocacaoAlterada> {
    await this.garantirCorrente(id);
    return this.alocacoes.mover(id, input);
  }

  async remover(id: string): Promise<AlocacaoAlterada> {
    await this.garantirCorrente(id);
    return this.alocacoes.remover(id);
  }

  /**
   * Trava de escrita para mover/remover: resolve o período pela alocação e
   * recusa se não for o corrente, ANTES do UPDATE/DELETE. `null` = alocação
   * inexistente — o mesmo 404 que o próprio write daria.
   */
  private async garantirCorrente(id: string): Promise<void> {
    const periodoId = await this.alocacoes.periodoDaAlocacao(id);
    if (!periodoId) {
      throw new NotFoundException(`Alocação ${id} não encontrada.`);
    }
    await this.periodoEditavel.garantir(periodoId);
  }
}
