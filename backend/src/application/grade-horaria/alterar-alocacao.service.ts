import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ALOCACOES_REPOSITORY,
  AlocacaoAlterada,
  MoverAlocacaoInput,
  USUARIOS_REPOSITORY,
} from './ports';
import type {
  AlocacoesRepository,
  CriarAlocacaoInput,
  UsuariosRepository,
} from './ports';

/** O que o cliente envia para criar uma aula — sem o autor, resolvido aqui. */
export type NovaAlocacao = Omit<CriarAlocacaoInput, 'criadoPorId'>;

/**
 * Escrita de alocações. Chronos NÃO bloqueia alocação conflitante — registra o
 * que a comissão decidir e deixa o motor sinalizar. Por isso não há validação de
 * conflito aqui: criar/mover uma aula é sempre permitido; o recálculo (feito
 * pelo controller após a escrita) é que mostra o que acendeu.
 */
@Injectable()
export class AlterarAlocacaoService {
  constructor(
    @Inject(ALOCACOES_REPOSITORY)
    private readonly alocacoes: AlocacoesRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuarios: UsuariosRepository,
  ) {}

  async criar(comando: NovaAlocacao): Promise<AlocacaoAlterada> {
    const criadoPorId = await this.usuarios.padraoId();
    if (!criadoPorId) {
      throw new ServiceUnavailableException(
        'Nenhum usuário disponível para registrar a alocação.',
      );
    }
    return this.alocacoes.criar({ ...comando, criadoPorId });
  }

  mover(id: string, input: MoverAlocacaoInput): Promise<AlocacaoAlterada> {
    return this.alocacoes.mover(id, input);
  }

  remover(id: string): Promise<AlocacaoAlterada> {
    return this.alocacoes.remover(id);
  }
}
