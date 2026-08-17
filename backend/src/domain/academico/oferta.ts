import { RegimeOferta } from './enums';

// ─────────────────────────────── Oferta ───────────────────────────────
// Oferta liga turma × disciplina × período (único por essa tripla). Carrega a
// codocência embutida: N professores, cada um com uma proporção de carga que
// soma 100. O curso/disciplina/período vêm resolvidos no registro plano para a
// listagem exibir sem novos requests.

export interface ProfessorDaOferta {
  professorId: string;
  professorNome: string;
  proporcaoCarga: number;
}

export interface Oferta {
  id: string;
  turmaId: string;
  turmaNome: string;
  cursoSigla: string;
  disciplinaId: string;
  disciplinaCodigo: string;
  disciplinaNome: string;
  periodoLetivoId: string;
  periodoCodigo: string;
  regime: RegimeOferta;
  aulasSemana: number;
  observacoes: string | null;
  professores: ProfessorDaOferta[];
}

export interface ProfessorOfertaInput {
  professorId: string;
  proporcaoCarga: number;
}

export interface CriarOfertaInput {
  turmaId: string;
  disciplinaId: string;
  periodoLetivoId: string;
  regime: RegimeOferta;
  aulasSemana: number;
  observacoes?: string | null;
  professores: ProfessorOfertaInput[];
}

export type AtualizarOfertaInput = Partial<CriarOfertaInput>;

/**
 * Regra de codocência (pura — a aplicação traduz o retorno em HTTP): as
 * proporções de uma oferta somam exatamente 100, sem professor repetido e sem
 * proporção não-positiva. Devolve a mensagem do primeiro erro, ou `null` se ok.
 */
export function erroProporcoes(
  professores: ProfessorOfertaInput[],
): string | null {
  if (professores.length === 0) {
    return 'Informe ao menos um professor para a oferta.';
  }
  const vistos = new Set<string>();
  for (const p of professores) {
    if (vistos.has(p.professorId)) {
      return 'Há professor repetido na mesma oferta.';
    }
    vistos.add(p.professorId);
    if (!(p.proporcaoCarga > 0)) {
      return 'Cada proporção de carga deve ser maior que zero.';
    }
  }
  const soma = professores.reduce((s, p) => s + p.proporcaoCarga, 0);
  // Arredonda para 2 casas antes de comparar (proporção é numeric(5,2)).
  if (Math.round(soma * 100) / 100 !== 100) {
    return `As proporções de carga devem somar 100% (soma atual: ${soma}%).`;
  }
  return null;
}

export const OFERTAS_REPOSITORY = Symbol('OFERTAS_REPOSITORY');
export interface OfertasRepository {
  /** Lista as ofertas; quando `periodoLetivoId` é dado, só as daquele período. */
  listar(periodoLetivoId?: string): Promise<Oferta[]>;
  buscarPorId(id: string): Promise<Oferta | null>;
  criar(input: CriarOfertaInput): Promise<Oferta>;
  /** `null` quando não existe oferta com esse id. */
  atualizar(id: string, input: AtualizarOfertaInput): Promise<Oferta | null>;
  /** `false` quando não existe oferta com esse id. */
  remover(id: string): Promise<boolean>;
}
