import { Modalidade, RegimeOferta } from '../../core/models/academico.models';

export const AULAS_POR_HORA = 6 / 5;

export const SEMANAS_POR_REGIME: Record<RegimeOferta, number> = {
  SEMESTRAL: 18,
  ANUAL: 36,
};

export function regimeDaModalidade(modalidade: Modalidade): RegimeOferta {
  return modalidade === 'INTEGRADO' ? 'ANUAL' : 'SEMESTRAL';
}

export interface SugestaoAulasSemana {
  aulasSemana: number;
  aulasNoPeriodo: number;
  semanas: number;
  exato: number;
}

export function sugerirAulasSemana(
  cargaHoraria: number | null | undefined,
  regime: RegimeOferta | '',
): SugestaoAulasSemana | null {
  if (!cargaHoraria || cargaHoraria <= 0 || !regime) return null;
  const semanas = SEMANAS_POR_REGIME[regime];
  if (!semanas) return null;

  const aulasNoPeriodo = cargaHoraria * AULAS_POR_HORA;
  const exato = aulasNoPeriodo / semanas;
  return {
    aulasSemana: Math.max(1, Math.round(exato)),
    aulasNoPeriodo,
    semanas,
    exato,
  };
}
