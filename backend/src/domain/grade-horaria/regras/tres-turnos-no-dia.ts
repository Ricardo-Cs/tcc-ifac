import { Conflito, TipoConflito } from '../conflito';
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

export const MAXIMO_TURNOS_NO_DIA = 2;

export class RegraTresTurnosNoDia implements Regra {
  readonly tipo = TipoConflito.TRES_TURNOS_NO_DIA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const { professorId, dia, aulas } of diasPorProfessor(snapshot)) {
      const turnos = new Set(aulas.map((a) => a.turno));
      if (turnos.size <= MAXIMO_TURNOS_NO_DIA) continue;

      const professor = nomeProfessor(snapshot, professorId);
      conflitos.push({
        tipo: TipoConflito.TRES_TURNOS_NO_DIA,
        severidade: severidadeDaJornada(snapshot, professorId, aulas),
        participantes: participantesDe(aulas),
        contexto: [professorId, `dia-${dia}`],
        alocacoesEnvolvidas: alocacoesDe(aulas),
        mensagem: `${professor} tem aula nos três turnos de ${nomeDia(dia)}.`,
      });
    }

    return conflitos;
  }
}
