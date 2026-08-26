import { ResultadoAvaliacao } from '@application/grade-horaria/avaliar-grade.use-case';
import {
  Conflito,
  SeveridadeConflito,
  TipoConflito,
} from '@domain/grade-horaria/conflito';
import {
  CursoSnapshot,
  GradeSnapshot,
  ProfessorSnapshot,
  TurmaSnapshot,
} from '@domain/grade-horaria/snapshot';
import { cargaLetivaPorProfessor } from '@domain/grade-horaria/carga-letiva';

export interface AulaView {
  id: string;
  ofertaId: string;
  version: number;
  grupoBloco: string | null;
  disciplina: { codigo: string; nome: string } | null;
  turma: string | null;
  turmaId: string | null;
  cursoId: string | null;
  professores: string[];
  sala: string | null;
  salaId: string | null;
  slot: {
    id: string;
    codigo: string;
    diaSemana: number;
    turno: string;
    ordem: number;
  } | null;
}

export interface ConflitoView {
  chave: string;
  tipo: TipoConflito;
  severidade: SeveridadeConflito;
  mensagem: string;
  alocacoesEnvolvidas: string[];
  aceitavel: boolean;
}

export interface SlotView {
  id: string;
  codigo: string;
  diaSemana: number;
  turno: string;
  ordem: number;
  horaInicio: string;
  horaFim: string;
}

export interface CursoView {
  id: string;
  nome: string;
  sigla: string;
  modalidade: string;
  turnoPadrao: string;
}

export interface TurmaView {
  id: string;
  nome: string;
  cursoId: string;
}

export interface ProfessorCargaView {
  nome: string;
  cargaHorariaAtual: number;
}

export interface GradeView {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: AulaView[];
  slots: SlotView[];
  cursos: CursoView[];
  turmas: TurmaView[];
  professores: ProfessorCargaView[];
  conflitos: ConflitoView[];
}

function nomesProfessores(snapshot: GradeSnapshot, ofertaId: string): string[] {
  const oferta = snapshot.ofertas.get(ofertaId);
  if (!oferta) return [];
  return oferta.professores.map(
    (p) => snapshot.professores.get(p.professorId)?.nome ?? p.professorId,
  );
}

function montarAula(snapshot: GradeSnapshot, alocacao): AulaView {
  const oferta = snapshot.ofertas.get(alocacao.ofertaId);
  const disciplina = oferta
    ? snapshot.disciplinas.get(oferta.disciplinaId)
    : undefined;
  const turma = oferta ? snapshot.turmas.get(oferta.turmaId) : undefined;
  const slot = snapshot.slots.get(alocacao.slotId);
  const sala = alocacao.salaId
    ? snapshot.salas.get(alocacao.salaId)
    : undefined;

  return {
    id: alocacao.id,
    ofertaId: alocacao.ofertaId,
    version: alocacao.version,
    grupoBloco: alocacao.grupoBloco,
    disciplina: disciplina
      ? { codigo: disciplina.codigo, nome: disciplina.nome }
      : null,
    turma: turma?.nome ?? null,
    turmaId: turma?.id ?? null,
    cursoId: turma?.cursoId ?? null,
    professores: nomesProfessores(snapshot, alocacao.ofertaId),
    sala: sala?.nome ?? null,
    salaId: alocacao.salaId ?? null,
    slot: slot
      ? {
          id: slot.id,
          codigo: slot.codigo,
          diaSemana: slot.diaSemana,
          turno: slot.turno,
          ordem: slot.ordem,
        }
      : null,
  };
}

function montarConflito(conflito: Conflito & { chave: string }): ConflitoView {
  return {
    chave: conflito.chave,
    tipo: conflito.tipo,
    severidade: conflito.severidade,
    mensagem: conflito.mensagem,
    alocacoesEnvolvidas: conflito.alocacoesEnvolvidas,
    aceitavel: conflito.severidade !== SeveridadeConflito.FORTE,
  };
}

function cursosDaGrade(snapshot: GradeSnapshot): CursoView[] {
  const ids = new Set<string>();
  for (const oferta of snapshot.ofertas.values()) {
    const turma = snapshot.turmas.get(oferta.turmaId);
    if (turma) ids.add(turma.cursoId);
  }
  return [...ids]
    .map((id) => snapshot.cursos.get(id))
    .filter((c): c is CursoSnapshot => !!c)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      sigla: c.sigla,
      modalidade: c.modalidade,
      turnoPadrao: c.turnoPadrao,
    }))
    .sort((a, b) => a.sigla.localeCompare(b.sigla));
}

function turmasDaGrade(snapshot: GradeSnapshot): TurmaView[] {
  const ids = new Set<string>();
  for (const oferta of snapshot.ofertas.values()) {
    ids.add(oferta.turmaId);
  }
  return [...ids]
    .map((id) => snapshot.turmas.get(id))
    .filter((t): t is TurmaSnapshot => !!t)
    .map((t) => ({ id: t.id, nome: t.nome, cursoId: t.cursoId }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function professoresDaGrade(snapshot: GradeSnapshot): ProfessorCargaView[] {
  const carga = cargaLetivaPorProfessor(snapshot);
  const ids = new Set<string>();
  for (const alocacao of snapshot.alocacoes) {
    const oferta = snapshot.ofertas.get(alocacao.ofertaId);
    if (!oferta) continue;
    for (const { professorId } of oferta.professores) ids.add(professorId);
  }
  return [...ids]
    .map((id) => snapshot.professores.get(id))
    .filter((p): p is ProfessorSnapshot => !!p)
    .map((p) => ({ nome: p.nome, cargaHorariaAtual: carga.get(p.id) ?? 0 }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export function montarGradeView(resultado: ResultadoAvaliacao): GradeView {
  const { snapshot } = resultado;
  return {
    periodoLetivoId: resultado.periodoLetivoId,
    coletaImportada: resultado.coletaImportada,
    aulas: snapshot.alocacoes.map((a) => montarAula(snapshot, a)),
    cursos: cursosDaGrade(snapshot),
    turmas: turmasDaGrade(snapshot),
    professores: professoresDaGrade(snapshot),
    slots: [...snapshot.slots.values()]
      .map((s) => ({
        id: s.id,
        codigo: s.codigo,
        diaSemana: s.diaSemana,
        turno: s.turno,
        ordem: s.ordem,
        horaInicio: s.horaInicio,
        horaFim: s.horaFim,
      }))
      .sort((a, b) => a.diaSemana - b.diaSemana || a.ordem - b.ordem),
    conflitos: resultado.conflitos.map(montarConflito),
  };
}
