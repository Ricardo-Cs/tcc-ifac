import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ConflitoForteNaoAceitavelError,
  chaveDoAceite,
} from '../../domain/grade-horaria/aceite-conflito';
import { AvaliarGradeUseCase } from './avaliar-grade.use-case';
import {
  ACEITES_REPOSITORY,
  USUARIOS_REPOSITORY,
} from '@domain/grade-horaria/ports';
import type {
  AceitesRepository,
  UsuariosRepository,
} from '@domain/grade-horaria/ports';

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
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuarios: UsuariosRepository,
  ) {}

  async aceitar(
    periodoLetivoId: string,
    chave: string,
    justificativa: string,
  ): Promise<void> {
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

    const aceitoPorId = await this.usuarios.padraoId();
    if (!aceitoPorId) {
      throw new ServiceUnavailableException(
        'Nenhum usuário disponível para registrar o aceite.',
      );
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
