import { Conflito, TipoConflito } from '../conflito';
import { MINUTOS_POR_DIA, MINUTOS_POR_HORA, formatarDuracao } from '../horario';
import { GradeSnapshot } from '../snapshot';
import {
  DiaDoProfessor,
  alocacoesDe,
  diasPorProfessor,
  nomeDia,
  nomeProfessor,
  participantesDe,
  severidadeDaJornada,
} from './jornada';
import { Regra } from './regra';

export const HORAS_MINIMAS_ENTRE_JORNADAS = 11;

export class RegraInterjornada implements Regra {
  readonly tipo = TipoConflito.INTERJORNADA_VIOLADA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    const conflitos: Conflito[] = [];
    const limite = HORAS_MINIMAS_ENTRE_JORNADAS * MINUTOS_POR_HORA;

    for (const [professorId, dias] of agruparPorProfessor(snapshot)) {
      for (const [numero, dia] of dias) {
        const seguinte = dias.get(numero + 1);
        if (!seguinte) continue;

        const ultima = dia.aulas[dia.aulas.length - 1];
        const primeira = seguinte.aulas[0];
        const intervalo = MINUTOS_POR_DIA - ultima.fim + primeira.inicio;
        if (intervalo >= limite) continue;

        const envolvidas = [ultima, primeira];
        const professor = nomeProfessor(snapshot, professorId);
        conflitos.push({
          tipo: TipoConflito.INTERJORNADA_VIOLADA,
          severidade: severidadeDaJornada(snapshot, professorId, envolvidas),
          participantes: participantesDe(envolvidas),
          contexto: [professorId, `dias-${numero}-${numero + 1}`],
          alocacoesEnvolvidas: alocacoesDe(envolvidas),
          mensagem: `${professor} tem ${formatarDuracao(intervalo)} de descanso entre ${nomeDia(numero)} e ${nomeDia(numero + 1)} (mínimo de ${HORAS_MINIMAS_ENTRE_JORNADAS}h).`,
        });
      }
    }

    return conflitos;
  }
}

function agruparPorProfessor(
  snapshot: GradeSnapshot,
): Map<string, Map<number, DiaDoProfessor>> {
  const porProfessor = new Map<string, Map<number, DiaDoProfessor>>();
  for (const dia of diasPorProfessor(snapshot)) {
    const dias = porProfessor.get(dia.professorId) ?? new Map();
    dias.set(dia.dia, dia);
    porProfessor.set(dia.professorId, dias);
  }
  return porProfessor;
}
