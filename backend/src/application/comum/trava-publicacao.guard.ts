import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  CONFLITOS_PERIODO_CHECKER,
  PublicacaoComConflitoForteError,
  garantirPodePublicar,
} from '@domain/comum/trava-publicacao';
import type { ConflitosPeriodoChecker } from '@domain/comum/trava-publicacao';

@Injectable()
export class TravaPublicacaoGuard {
  constructor(
    @Inject(CONFLITOS_PERIODO_CHECKER)
    private readonly checker: ConflitosPeriodoChecker,
  ) {}

  async garantir(periodoLetivoId: string): Promise<void> {
    try {
      garantirPodePublicar(
        await this.checker.existeConflitoForte(periodoLetivoId),
      );
    } catch (erro) {
      if (erro instanceof PublicacaoComConflitoForteError) {
        throw new ConflictException(erro.message);
      }
      throw erro;
    }
  }
}
