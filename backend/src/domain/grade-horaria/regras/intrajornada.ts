import { Conflito, TipoConflito } from '../conflito';
import { MINUTOS_POR_HORA, formatarDuracao } from '../horario';
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

export const MINUTOS_MINIMOS_ENTRE_TURNOS = MINUTOS_POR_HORA;

export class RegraIntrajornada implements Regra {
  readonly tipo = TipoConflito.INTRAJORNADA_VIOLADA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];

    for (const { professorId, dia, aulas } of diasPorProfessor(snapshot)) {
      for (let i = 1; i < aulas.length; i++) {
        const anterior = aulas[i - 1];
        const atual = aulas[i];
        if (anterior.turno === atual.turno) continue;

        const intervalo = atual.inicio - anterior.fim;
        if (intervalo >= MINUTOS_MINIMOS_ENTRE_TURNOS) continue;

        const envolvidas = [anterior, atual];
        const professor = nomeProfessor(snapshot, professorId);
        conflitos.push({
          tipo: TipoConflito.INTRAJORNADA_VIOLADA,
          severidade: severidadeDaJornada(snapshot, professorId, envolvidas),
          participantes: participantesDe(envolvidas),
          contexto: [professorId, `dia-${dia}`, anterior.turno, atual.turno],
          alocacoesEnvolvidas: alocacoesDe(envolvidas),
          mensagem: `${professor} tem ${formatarDuracao(intervalo)} entre os turnos de ${nomeDia(dia)} (mínimo de 1h).`,
        });
      }
    }

    return conflitos;
  }
}
