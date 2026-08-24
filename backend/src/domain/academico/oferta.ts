import { Modalidade, RegimeOferta } from './enums';

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

export function regimeDaModalidade(modalidade: Modalidade): RegimeOferta {
  return modalidade === Modalidade.INTEGRADO
    ? RegimeOferta.ANUAL
    : RegimeOferta.SEMESTRAL;
}

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
  if (Math.round(soma * 100) / 100 !== 100) {
    return `As proporções de carga devem somar 100% (soma atual: ${soma}%).`;
  }
  return null;
}

export const OFERTAS_REPOSITORY = Symbol('OFERTAS_REPOSITORY');
export interface OfertasRepository {
  listar(periodoLetivoId?: string): Promise<Oferta[]>;
  buscarPorId(id: string): Promise<Oferta | null>;
  criar(input: CriarOfertaInput): Promise<Oferta>;
  atualizar(id: string, input: AtualizarOfertaInput): Promise<Oferta | null>;
  remover(id: string): Promise<boolean>;
}
