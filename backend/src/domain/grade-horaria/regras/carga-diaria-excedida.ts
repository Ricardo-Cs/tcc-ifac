import { Conflito, TipoConflito } from '../conflito';
import { MINUTOS_POR_AULA, aulasParaHoras, formatarDuracao } from '../horario';
import { GradeSnapshot } from '../snapshot';
import {
  alocacoesDe,
  diasPorProfessor,
  nomeDia,
  nomeProfessor,
  participantesDe,
  severidadeDaJornada,
} from './jornada';
import { Regra } from './regra';

export const HORAS_MAXIMAS_DE_AULA_NO_DIA = 8;

export class RegraCargaDiariaExcedida implements Regra {
  readonly tipo = TipoConflito.CARGA_DIARIA_EXCEDIDA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const { professorId, dia, aulas } of diasPorProfessor(snapshot)) {
      const slots = new Set(aulas.map((a) => a.slotId));
      if (aulasParaHoras(slots.size) <= HORAS_MAXIMAS_DE_AULA_NO_DIA) continue;

      const professor = nomeProfessor(snapshot, professorId);
      const duracao = formatarDuracao(slots.size * MINUTOS_POR_AULA);
      conflitos.push({
        tipo: TipoConflito.CARGA_DIARIA_EXCEDIDA,
        severidade: severidadeDaJornada(snapshot, professorId, aulas),
        participantes: participantesDe(aulas),
        contexto: [professorId, `dia-${dia}`],
        alocacoesEnvolvidas: alocacoesDe(aulas),
        mensagem: `${professor} tem ${slots.size} aulas em ${nomeDia(dia)} (${duracao}, acima do teto de ${HORAS_MAXIMAS_DE_AULA_NO_DIA}h).`,
      });
    }

    return conflitos;
  }
}
