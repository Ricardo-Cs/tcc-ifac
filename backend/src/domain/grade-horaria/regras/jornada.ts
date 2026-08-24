import { ParticipanteConflito, SeveridadeConflito } from '../conflito';
import { emMinutos } from '../horario';
import { AlocacaoSnapshot, GradeSnapshot, Id } from '../snapshot';

export interface AulaDoDia {
  alocacao: AlocacaoSnapshot;
  slotId: Id;
  turno: string;
  inicio: number;
  fim: number;
}

export interface DiaDoProfessor {
  professorId: Id;
  dia: number;
  aulas: AulaDoDia[];
}

const NOME_DO_DIA: Record<number, string> = {
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado',
  7: 'domingo',
};

export function nomeDia(dia: number): string {
  return NOME_DO_DIA[dia] ?? `dia ${dia}`;
}

export function nomeProfessor(
  snapshot: GradeSnapshot,
  professorId: Id,
): string {
  return snapshot.professores.get(professorId)?.nome ?? professorId;
}

export function diasPorProfessor(snapshot: GradeSnapshot): DiaDoProfessor[] {
  const porChave = new Map<string, AulaDoDia[]>();

  for (const alocacao of snapshot.alocacoes) {
    const oferta = snapshot.ofertas.get(alocacao.ofertaId);
    const slot = snapshot.slots.get(alocacao.slotId);
    if (!oferta || !slot) continue;

    const aula: AulaDoDia = {
      alocacao,
      slotId: slot.id,
      turno: slot.turno,
      inicio: emMinutos(slot.horaInicio),
      fim: emMinutos(slot.horaFim),
    };

    for (const { professorId } of oferta.professores) {
      const chave = `${professorId}:${slot.diaSemana}`;
      const lista = porChave.get(chave);
      if (lista) {
        lista.push(aula);
      } else {
        porChave.set(chave, [aula]);
      }
    }
  }

  const dias: DiaDoProfessor[] = [];
  for (const [chave, aulas] of porChave) {
    const separador = chave.lastIndexOf(':');
    dias.push({
      professorId: chave.slice(0, separador),
      dia: Number(chave.slice(separador + 1)),
      aulas: aulas.sort(
        (a, b) => a.inicio - b.inicio || a.slotId.localeCompare(b.slotId),
      ),
    });
  }
  return dias;
}

export function participantesDe(aulas: AulaDoDia[]): ParticipanteConflito[] {
  const vistos = new Set<string>();
  const participantes: ParticipanteConflito[] = [];
  for (const aula of aulas) {
    const chave = `${aula.alocacao.ofertaId}@${aula.slotId}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    participantes.push({
      ofertaId: aula.alocacao.ofertaId,
      slotId: aula.slotId,
    });
  }
  return participantes;
}

export function alocacoesDe(aulas: AulaDoDia[]): string[] {
  return [...new Set(aulas.map((a) => a.alocacao.id))];
}

export function severidadeDaJornada(
  snapshot: GradeSnapshot,
  professorId: Id,
  aulas: AulaDoDia[],
): SeveridadeConflito {
  const cargaIntegralEmTodas = aulas.every(
    (aula) =>
      proporcaoDoProfessor(snapshot, aula.alocacao.ofertaId, professorId) >=
      100,
  );
  return cargaIntegralEmTodas
    ? SeveridadeConflito.FORTE
    : SeveridadeConflito.POTENCIAL;
}

function proporcaoDoProfessor(
  snapshot: GradeSnapshot,
  ofertaId: Id,
  professorId: Id,
): number {
  const participacao = snapshot.ofertas
    .get(ofertaId)
    ?.professores.find((p) => p.professorId === professorId);
  return participacao?.proporcaoCarga ?? 0;
}
