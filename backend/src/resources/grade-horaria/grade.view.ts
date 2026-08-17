/**
 * Monta o modelo de leitura que a interface consome: a grade "achatada" com
 * nomes já resolvidos (disciplina, turma, professores, sala, slot) e a lista de
 * conflitos. É a fronteira entre o domínio e o mundo HTTP — o controller não
 * devolve o `GradeSnapshot` cru, que é estrutura de trabalho do motor.
 */
import { ResultadoAvaliacao } from '@application/grade-horaria/avaliar-grade.use-case';
import {
  Conflito,
  SeveridadeConflito,
  TipoConflito,
} from '@domain/grade-horaria/conflito';
import {
  CursoSnapshot,
  GradeSnapshot,
  TurmaSnapshot,
} from '@domain/grade-horaria/snapshot';

export interface AulaView {
  id: string;
  ofertaId: string;
  grupoBloco: string | null;
  disciplina: { codigo: string; nome: string } | null;
  /** Nome da turma — o rótulo que a interface imprime no cartão da aula. */
  turma: string | null;
  /**
   * Id da turma. É por ele que a grade se separa DE FATO: um curso tem várias
   * turmas correndo no mesmo período (SI tem 1º, 3º e 6º ao mesmo tempo), cada
   * uma com sua própria grade. Filtrar só por curso empilha as três na mesma
   * célula e faz parecer conflito o que é só sobreposição de visões.
   */
  turmaId: string | null;
  /**
   * Id do curso da turma — o primeiro nível do recorte. Só o id: o rótulo vem
   * de `GradeView.cursos`, para não repetir nome e sigla em cada aula.
   */
  cursoId: string | null;
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

/**
 * Os cursos que têm aula neste período — o menu de visões da interface. Vêm da
 * grade (não do catálogo inteiro) porque um curso sem oferta no período não
 * rende nenhuma tabela para desenhar.
 */
export interface CursoView {
  id: string;
  nome: string;
  sigla: string;
  modalidade: string;
  /** Turno em que o curso funciona — a interface desenha as linhas dele. */
  turnoPadrao: string;
}

/**
 * As turmas com oferta no período — o segundo nível do menu de visões. Uma
 * turma é a unidade que de fato tem "uma grade": é dela o horário que o aluno
 * recebe e que a comissão monta.
 */
export interface TurmaView {
  id: string;
  nome: string;
  cursoId: string;
}

export interface GradeView {
  periodoLetivoId: string;
  coletaImportada: boolean;
  aulas: AulaView[];
  slots: SlotView[];
  cursos: CursoView[];
  turmas: TurmaView[];
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
    turmaId: turma?.id ?? null,
    cursoId: turma?.cursoId ?? null,
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

/**
 * Os cursos alcançados pelas ofertas do período, em ordem de sigla. Sai das
 * OFERTAS (não das alocações) para que um curso já cadastrado apareça na
 * interface mesmo antes de ter a primeira aula posta na grade — do contrário a
 * comissão não teria onde soltar a primeira aula dele.
 */
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

/**
 * As turmas alcançadas pelas ofertas do período, em ordem de nome. Mesma razão
 * de `cursosDaGrade`: sai das OFERTAS, não das alocações, para que uma turma
 * ainda sem aula posta apareça na interface — do contrário a comissão não teria
 * onde soltar a primeira aula dela.
 */
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

export function montarGradeView(resultado: ResultadoAvaliacao): GradeView {
  const { snapshot } = resultado;
  return {
    periodoLetivoId: resultado.periodoLetivoId,
    coletaImportada: resultado.coletaImportada,
    aulas: snapshot.alocacoes.map((a) => montarAula(snapshot, a)),
    cursos: cursosDaGrade(snapshot),
    turmas: turmasDaGrade(snapshot),
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
