/**
 * Gerador de RASCUNHO INICIAL da grade — NÃO é um solver de otimização. Varre
 * as ofertas alocáveis e encaixa cada aula faltante no primeiro slot livre que
 * encontrar, sem tentar minimizar buracos, sem respeitar blocagem de aulas
 * teóricas (ODP) e sem checar as regras de jornada (interjornada/intrajornada/
 * carga diária). O resultado é só um PONTO DE PARTIDA: alocações comuns,
 * criadas uma a uma exatamente como o arrasto manual do catálogo faria — a
 * comissão continua livre para mover, remover ou aceitar qualquer conflito que
 * o motor acender depois. Chronos não gera a grade de forma autoritativa; isto
 * só poupa o trabalho braçal de arrastar as ofertas óbvias uma por uma.
 *
 * Evita ativamente (não cria mesmo sem checagem de conflito depois):
 *  - professor da oferta já ocupado no slot (em qualquer proporção de carga);
 *  - turma da oferta já ocupada no slot;
 *  - professor com restrição de horário naquele slot (legal OU pessoal — o
 *    gerador é conservador por padrão; a comissão decide caso a caso se quer
 *    sobrepor uma restrição pessoal manualmente).
 * Sala fica sempre NULA (mesma decisão do arrasto-do-catálogo): não mistura
 * geração com SALA_OCUPADA; a comissão atribui sala depois.
 */
import { Modalidade, Turno } from '../academico/enums';
import { ofertasAlocaveis } from './ofertas-alocaveis';
import { GeradorGradeInicial, PropostaAlocacao } from './ports';
import {
  GradeSnapshot,
  Id,
  OfertaSnapshot,
  SlotSnapshot,
  chaveProfessorSlot,
  chaveTurmaSlot,
} from './snapshot';

const TURNO_RANK: Record<Turno, number> = {
  [Turno.MANHA]: 0,
  [Turno.TARDE]: 1,
  [Turno.NOITE]: 2,
};

/** Implementação de `GeradorGradeInicial` (ver `ports.ts`) sobre `gerarGradeInicial`. */
export class GeradorGradeInicialGuloso implements GeradorGradeInicial {
  gerar(snapshot: GradeSnapshot): PropostaAlocacao[] {
    return gerarGradeInicial(snapshot);
  }
}

export function gerarGradeInicial(snapshot: GradeSnapshot): PropostaAlocacao[] {
  const ocupadoProfessorSlot = new Set(snapshot.porProfessorSlot.keys());
  const ocupadoTurmaSlot = new Set(snapshot.porTurmaSlot.keys());
  const todosOsSlots = [...snapshot.slots.values()];
  const propostas: PropostaAlocacao[] = [];

  for (const alocavel of ofertasAlocaveis(snapshot)) {
    const oferta = snapshot.ofertas.get(alocavel.ofertaId);
    if (!oferta) continue;

    const slotsOrdenados = ordenarSlotsParaOferta(
      todosOsSlots,
      oferta,
      snapshot,
    );
    let restantes = alocavel.aulasRestantes;

    for (const slot of slotsOrdenados) {
      if (restantes <= 0) break;
      if (
        !disponivel(
          oferta,
          slot.id,
          snapshot,
          ocupadoProfessorSlot,
          ocupadoTurmaSlot,
        )
      ) {
        continue;
      }

      propostas.push({ ofertaId: oferta.id, slotHorarioId: slot.id });
      ocupadoTurmaSlot.add(chaveTurmaSlot(oferta.turmaId, slot.id));
      for (const participacao of oferta.professores) {
        ocupadoProfessorSlot.add(
          chaveProfessorSlot(participacao.professorId, slot.id),
        );
      }
      restantes--;
    }
  }

  return propostas;
}

function disponivel(
  oferta: OfertaSnapshot,
  slotId: Id,
  snapshot: GradeSnapshot,
  ocupadoProfessorSlot: Set<string>,
  ocupadoTurmaSlot: Set<string>,
): boolean {
  if (ocupadoTurmaSlot.has(chaveTurmaSlot(oferta.turmaId, slotId)))
    return false;
  return oferta.professores.every((participacao) => {
    const chave = chaveProfessorSlot(participacao.professorId, slotId);
    return !ocupadoProfessorSlot.has(chave) && !snapshot.restricoes.has(chave);
  });
}

/**
 * Slots do turno da modalidade primeiro (INTEGRADO prefere manhã E tarde,
 * espelhando a mesma exceção hardcoded do front — ver `grade.ts`), depois dia,
 * turno e ordem — só para o rascunho sair num formato razoável de primeira
 * vista; não é uma regra de negócio que o motor de conflitos fiscalize.
 */
function ordenarSlotsParaOferta(
  slots: SlotSnapshot[],
  oferta: OfertaSnapshot,
  snapshot: GradeSnapshot,
): SlotSnapshot[] {
  const preferidos = turnosPreferidos(oferta, snapshot);
  return [...slots].sort((a, b) => {
    const prefA = preferidos.has(a.turno) ? 0 : 1;
    const prefB = preferidos.has(b.turno) ? 0 : 1;
    if (prefA !== prefB) return prefA - prefB;
    if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana;
    if (a.turno !== b.turno) return TURNO_RANK[a.turno] - TURNO_RANK[b.turno];
    return a.ordem - b.ordem;
  });
}

function turnosPreferidos(
  oferta: OfertaSnapshot,
  snapshot: GradeSnapshot,
): Set<Turno> {
  const turma = snapshot.turmas.get(oferta.turmaId);
  const curso = turma ? snapshot.cursos.get(turma.cursoId) : undefined;
  if (!curso) return new Set(Object.values(Turno));
  if (curso.modalidade === Modalidade.INTEGRADO) {
    return new Set([Turno.MANHA, Turno.TARDE]);
  }
  return new Set([curso.turnoPadrao]);
}
