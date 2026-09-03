import { GrupoRegime, Modalidade, Turno } from '../academico/enums';

export type Id = string;

export interface AlocacaoSnapshot {
  id: Id;
  ofertaId: Id;
  slotId: Id;
  salaId: Id | null;
  grupoBloco: string | null;
  version: number;
}

export interface ParticipacaoProfessor {
  professorId: Id;
  proporcaoCarga: number;
}

export interface OfertaSnapshot {
  id: Id;
  turmaId: Id;
  disciplinaId: Id;
  aulasSemana: number;
  professores: ParticipacaoProfessor[];
}

export interface ProfessorSnapshot {
  id: Id;
  nome: string;
  grupoRegime: GrupoRegime | null;
  ajusteCargaHoras: number | null;
  ajusteCargaMotivo: string | null;
}

export interface TurmaSnapshot {
  id: Id;
  nome: string;
  cursoId: Id;
}

export interface CursoSnapshot {
  id: Id;
  nome: string;
  sigla: string;
  modalidade: Modalidade;
  turnoPadrao: Turno;
}

export interface SalaSnapshot {
  id: Id;
  nome: string;
}

export interface DisciplinaSnapshot {
  id: Id;
  codigo: string;
  nome: string;
}

export interface SlotSnapshot {
  id: Id;
  codigo: string;
  diaSemana: number;
  turno: Turno;
  ordem: number;
  horaInicio: string;
  horaFim: string;
}

export function chaveProfessorSlot(professorId: Id, slotId: Id): string {
  return `${professorId}:${slotId}`;
}

export function chaveTurmaSlot(turmaId: Id, slotId: Id): string {
  return `${turmaId}:${slotId}`;
}

export function chaveSalaSlot(salaId: Id, slotId: Id): string {
  return `${salaId}:${slotId}`;
}

export interface DadosSnapshot {
  periodoLetivoId: Id;
  alocacoes: AlocacaoSnapshot[];
  ofertas: Map<Id, OfertaSnapshot>;
  professores: Map<Id, ProfessorSnapshot>;
  turmas: Map<Id, TurmaSnapshot>;
  cursos: Map<Id, CursoSnapshot>;
  disciplinas: Map<Id, DisciplinaSnapshot>;
  salas: Map<Id, SalaSnapshot>;
  slots: Map<Id, SlotSnapshot>;
  restricoes: Map<string, boolean>;
  coletaImportada: boolean;
}

export interface GradeSnapshot extends DadosSnapshot {
  porSlot: Map<Id, AlocacaoSnapshot[]>;
  porProfessorSlot: Map<string, AlocacaoSnapshot[]>;
  porTurmaSlot: Map<string, AlocacaoSnapshot[]>;
  porSalaSlot: Map<string, AlocacaoSnapshot[]>;
}
