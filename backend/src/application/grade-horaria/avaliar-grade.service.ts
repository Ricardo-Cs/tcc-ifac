import { Inject, Injectable } from '@nestjs/common';
import { construirSnapshot } from '../../domain/grade-horaria/construir-snapshot';
import { GradeSnapshot } from '../../domain/grade-horaria/snapshot';
import {
  Conflito,
  SeveridadeConflito,
} from '../../domain/grade-horaria/conflito';
import { chaveConflito } from '../../domain/grade-horaria/chave-conflito';
import { ACEITES_REPOSITORY, REGRAS, SNAPSHOT_LOADER } from './ports';
import type { AceitesRepository, Regras, SnapshotLoader } from './ports';

/** Um conflito ativo, já anotado com sua chave de identidade estável. */
export interface ConflitoAvaliado extends Conflito {
  /** `chaveConflito(c)` — o elo com um eventual aceite; útil ao front. */
  chave: string;
}

export interface ResultadoAvaliacao {
  periodoLetivoId: string;
  /** Reflete o snapshot: sem coleta, o motor opera em modo de aviso. */
  coletaImportada: boolean;
  /** O estado carregado, para a interface montar a grade sem recarregar. */
  snapshot: GradeSnapshot;
  /** Conflitos que a comissão ainda precisa ver (aceites já removidos). */
  conflitos: ConflitoAvaliado[];
}

/**
 * O orquestrador do motor de conflitos. Junta as três peças que o domínio
 * mantém separadas de propósito: carrega o estado (porta), roda as regras puras
 * e subtrai o que a comissão já aceitou. Não contém regra de negócio — regra
 * mora nas `Regra` do domínio; aqui é só a sequência.
 */
@Injectable()
export class AvaliarGradeService {
  constructor(
    @Inject(SNAPSHOT_LOADER) private readonly loader: SnapshotLoader,
    @Inject(ACEITES_REPOSITORY) private readonly aceites: AceitesRepository,
    @Inject(REGRAS) private readonly regras: Regras,
  ) {}

  async avaliar(periodoLetivoId: string): Promise<ResultadoAvaliacao> {
    const dados = await this.loader.carregar(periodoLetivoId);
    const snapshot = construirSnapshot(dados);

    const detectados = this.regras.flatMap((regra) => regra.avaliar(snapshot));
    const aceitas = await this.aceites.chavesDoPeriodo(periodoLetivoId);

    const conflitos = detectados
      .map((conflito) => ({ ...conflito, chave: chaveConflito(conflito) }))
      .filter((conflito) => !this.cobertoPorAceite(conflito, aceitas));

    return {
      periodoLetivoId,
      coletaImportada: snapshot.coletaImportada,
      snapshot,
      conflitos,
    };
  }

  /**
   * Um aceite só cobre um conflito cuja severidade ATUAL não seja FORTE. A chave
   * NÃO expira na transição POTENCIAL->FORTE (a codocência some sem a aula mudar
   * de slot: mesmo `oferta+slot`, mesma chave). Logo um aceite dado quando o
   * conflito era POTENCIAL continua casando pela chave depois que ele endurece —
   * e não deve mais escondê-lo. Ver a NOTA CRÍTICA em
   * `docs/chronos-duvidas-e-backlog.md` (B1.8).
   */
  private cobertoPorAceite(
    conflito: ConflitoAvaliado,
    aceitas: Set<string>,
  ): boolean {
    if (conflito.severidade === SeveridadeConflito.FORTE) return false;
    return aceitas.has(conflito.chave);
  }
}
