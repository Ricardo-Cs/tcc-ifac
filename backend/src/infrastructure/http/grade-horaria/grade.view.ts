/**
 * Monta o modelo de leitura que a interface consome: a grade "achatada" com
 * nomes já resolvidos (disciplina, turma, professores, sala, slot) e a lista de
 * conflitos. É a fronteira entre o domínio e o mundo HTTP — o controller não
 * devolve o `GradeSnapshot` cru, que é estrutura de trabalho do motor.
 */
import { ResultadoAvaliacao } from '../../../application/grade-horaria/avaliar-grade.service';
import {
  Conflito,
  SeveridadeConflito,
  TipoConflito,
} from '../../../domain/grade-horaria/conflito';
import { GradeSnapshot } from '../../../domain/grade-horaria/snapshot';

export interface AulaView {
  id: string;
  ofertaId: string;
  grupoBloco: string | null;
  disciplina: { codigo: string; nome: string } | null;
  turma: string | null;
  professores: string[];
  sala: string | null;
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

/**
 * Catálogo de horários do período — TODOS os slots, não só os ocupados. É o que
 * permite à interface desenhar a grade inteira (inclusive células vazias) e
 * saber o `id` de destino ao mover uma aula para um horário ainda livre; sem
 * isso o front só conheceria os slots que já têm aula.
 */
export interface SlotView {
  id: string;
  codigo: string;
  diaSemana: number;
  turno: string;
  ordem: number;
  /** Faixa horária "HH:MM:SS" — a interface exibe no cabeçalho da linha. */
  horaInicio: string;
  horaFim: string;
}

export interface GradeView {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: AulaView[];
  slots: SlotView[];
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
    grupoBloco: alocacao.grupoBloco,
    disciplina: disciplina
      ? { codigo: disciplina.codigo, nome: disciplina.nome }
      : null,
    turma: turma?.nome ?? null,
    professores: nomesProfessores(snapshot, alocacao.ofertaId),
    sala: sala?.nome ?? null,
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
    // FORTE nunca é aceitável — a interface esconde o botão de aceitar.
    aceitavel: conflito.severidade !== SeveridadeConflito.FORTE,
  };
}

export function montarGradeView(resultado: ResultadoAvaliacao): GradeView {
  const { snapshot } = resultado;
  return {
    periodoLetivoId: resultado.periodoLetivoId,
    coletaImportada: resultado.coletaImportada,
    aulas: snapshot.alocacoes.map((a) => montarAula(snapshot, a)),
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
