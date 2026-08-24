import { Aula, Conflito, Severidade, Slot } from '../../core/models/grade.models';
import { SEVERIDADE_RANK } from './severidade';

export const TODAS_AS_TURMAS = '__todas__';

export const DIAS = [
  { num: 1, nome: 'Segunda' },
  { num: 2, nome: 'Terça' },
  { num: 3, nome: 'Quarta' },
  { num: 4, nome: 'Quinta' },
  { num: 5, nome: 'Sexta' },
];

export const TURNO_RANK: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };
export const TURNO_ROTULO: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

export function hhmm(hora: string): string {
  return hora?.slice(0, 5) ?? '';
}

export function chaveCelula(dia: number, turno: string, ordem: number): string {
  return `${dia}-${turno}-${ordem}`;
}

export interface AulaVm {
  aula: Aula;
  severidade: Severidade | null;
  sigla: string | null;
}

export interface CelulaVm {
  dia: number;
  turno: string;
  ordem: number;
  aulas: AulaVm[];
}

export interface LinhaVm {
  turnoRotulo: string;
  faixa: string;
  celulas: CelulaVm[];
  iniciaTurno: boolean;
}

export interface ConflitoVm {
  conflito: Conflito;
  outrasTurmas: string[];
}

export interface EscopoConflitos {
  nivel: 'turma' | 'curso' | 'todos';
  rotulo: string | null;
}

export function mapaSeveridadePorAula(conflitos: Conflito[]): Map<string, Severidade> {
  const mapa = new Map<string, Severidade>();
  for (const c of conflitos) {
    for (const id of c.alocacoesEnvolvidas) {
      const atual = mapa.get(id);
      if (atual === undefined || SEVERIDADE_RANK[c.severidade] < SEVERIDADE_RANK[atual]) {
        mapa.set(id, c.severidade);
      }
    }
  }
  return mapa;
}

export function montarLinhas(
  aulas: Aula[],
  slots: Slot[],
  severidadePorAula: Map<string, Severidade>,
  siglaPorCurso: Map<string, string>,
  turnos: Set<string> | null,
): LinhaVm[] {
  const slotPorCelula = new Map<string, Slot>();
  for (const s of slots) {
    slotPorCelula.set(chaveCelula(s.diaSemana, s.turno, s.ordem), s);
  }

  const aulasPorSlot = new Map<string, Aula[]>();
  for (const a of aulas) {
    if (!a.slot) continue;
    const lista = aulasPorSlot.get(a.slot.id) ?? [];
    lista.push(a);
    aulasPorSlot.set(a.slot.id, lista);
  }

  const aulaVm = (aula: Aula): AulaVm => ({
    aula,
    severidade: severidadePorAula.get(aula.id) ?? null,
    sigla: aula.cursoId ? (siglaPorCurso.get(aula.cursoId) ?? null) : null,
  });

  const vistas = new Map<string, { turno: string; ordem: number }>();
  for (const s of slots) {
    if (turnos && !turnos.has(s.turno)) continue;
    const chave = `${s.turno}-${s.ordem}`;
    if (!vistas.has(chave)) vistas.set(chave, { turno: s.turno, ordem: s.ordem });
  }
  const ordenadas = [...vistas.values()].sort(
    (a, b) => (TURNO_RANK[a.turno] ?? 9) - (TURNO_RANK[b.turno] ?? 9) || a.ordem - b.ordem,
  );

  let turnoAnterior: string | null = null;
  return ordenadas.map(({ turno, ordem }) => {
    const celulas: CelulaVm[] = DIAS.map((dia) => {
      const slot = slotPorCelula.get(chaveCelula(dia.num, turno, ordem));
      const aulasDaCelula = slot ? (aulasPorSlot.get(slot.id) ?? []).map(aulaVm) : [];
      return { dia: dia.num, turno, ordem, aulas: aulasDaCelula };
    });
    const modelo = slotPorCelula.get(chaveCelula(DIAS[0].num, turno, ordem));
    const faixa = modelo ? `${hhmm(modelo.horaInicio)} – ${hhmm(modelo.horaFim)}` : '';
    const iniciaTurno = turnoAnterior !== null && turno !== turnoAnterior;
    turnoAnterior = turno;
    return { turnoRotulo: TURNO_ROTULO[turno] ?? turno, faixa, celulas, iniciaTurno };
  });
}
