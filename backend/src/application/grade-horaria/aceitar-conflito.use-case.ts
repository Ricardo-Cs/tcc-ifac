import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ConflitoForteNaoAceitavelError,
  chaveDoAceite,
} from '../../domain/grade-horaria/aceite-conflito';
import { AvaliarGradeUseCase } from './avaliar-grade.use-case';
import { PeriodoEditavelGuard } from './periodo-editavel.guard';
import { ACEITES_REPOSITORY } from '@domain/grade-horaria/ports';
import type { AceitesRepository } from '@domain/grade-horaria/ports';

/**
 * Registra a decisão da comissão de conviver com um conflito. A severidade é
 * verdade do servidor, então NÃO se confia na `chave` do cliente sozinha:
 * reavalia-se a grade, acha-se o conflito atual daquela chave e valida-se no
 * domínio (`chaveDoAceite`) que ele não é FORTE — conflito FORTE não é aceitável,
 * resolve-se. Só então grava.
 */
@Injectable()
export class AceitarConflitoUseCase {
  constructor(
    private readonly avaliarGrade: AvaliarGradeUseCase,
    @Inject(ACEITES_REPOSITORY)
    private readonly aceites: AceitesRepository,
    private readonly periodoEditavel: PeriodoEditavelGuard,
  ) {}

  async aceitar(
    periodoLetivoId: string,
    chave: string,
    justificativa: string,
    aceitoPorId: string,
  ): Promise<void> {
    // Aceitar um conflito grava uma decisão: é escrita, então segue a mesma
    // trava — só o período corrente aceita. Barra antes de reavaliar a grade.
    await this.periodoEditavel.garantir(periodoLetivoId);

    const { conflitos } = await this.avaliarGrade.avaliar(periodoLetivoId);
    const conflito = conflitos.find((c) => c.chave === chave);
    if (!conflito) {
      // Não está na lista: ou já foi aceito, ou a aula mudou de slot e a chave
      // expirou. Em qualquer caso, não há o que aceitar agora.
      throw new NotFoundException(
        'Conflito não encontrado para esta chave (já resolvido, movido ou aceito).',
      );
    }

    try {
      chaveDoAceite(conflito); // invariante de domínio: FORTE não é aceitável.
    } catch (erro) {
      if (erro instanceof ConflitoForteNaoAceitavelError) {
        throw new UnprocessableEntityException(erro.message);
      }
      throw erro;
    }

    await this.aceites.registrar({
      chave,
      // Representante só para o gancho de CASCADE; a identidade é a `chave`.
      alocacaoId: conflito.alocacoesEnvolvidas[0],
      justificativa,
      aceitoPorId,
    });
  }
}
