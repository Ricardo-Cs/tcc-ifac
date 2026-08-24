import { Turno } from '../../academico/enums';
import { SeveridadeConflito, TipoConflito } from '../conflito';
import {
  alocacao,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from '../fixtures';
import { RegraTresTurnosNoDia } from './tres-turnos-no-dia';

const manha = (dia: number) =>
  slot({
    id: `d${dia}-m1`,
    diaSemana: dia,
    turno: Turno.MANHA,
    ordem: 1,
    horaInicio: '07:30:00',
    horaFim: '08:20:00',
  });

const tarde = (dia: number) =>
  slot({
    id: `d${dia}-t1`,
    diaSemana: dia,
    turno: Turno.TARDE,
    ordem: 1,
    horaInicio: '13:30:00',
    horaFim: '14:20:00',
  });

const noite = (dia: number) =>
  slot({
    id: `d${dia}-n1`,
    diaSemana: dia,
    turno: Turno.NOITE,
    ordem: 1,
    horaInicio: '18:50:00',
    horaFim: '19:40:00',
  });

describe('RegraTresTurnosNoDia', () => {
  const regra = new RegraTresTurnosNoDia();

  it('não acende com dois turnos no mesmo dia', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [manha(1), tarde(1)],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'd1-m1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'd1-t1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('acende FORTE com os três turnos no mesmo dia', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1', nome: 'Flavio' })],
      turmas: [turma({ id: 't1' })],
      slots: [manha(1), tarde(1), noite(1)],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'd1-m1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'd1-t1' }),
        alocacao({ id: 'a3', ofertaId: 'o1', slotId: 'd1-n1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.TRES_TURNOS_NO_DIA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2', 'a3']);
    expect(conflitos[0].mensagem).toContain('Flavio');
    expect(conflitos[0].mensagem).toContain('segunda');
  });

  it('não junta turnos de dias diferentes', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [manha(1), tarde(1), noite(2)],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'd1-m1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'd1-t1' }),
        alocacao({ id: 'a3', ofertaId: 'o1', slotId: 'd2-n1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('acusa um conflito por professor quando a oferta tem codocência', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      turmas: [turma({ id: 't1' })],
      slots: [manha(1), tarde(1), noite(1)],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 60 },
            { professorId: 'p2', proporcaoCarga: 40 },
          ],
        }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'd1-m1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'd1-t1' }),
        alocacao({ id: 'a3', ofertaId: 'o1', slotId: 'd1-n1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(2);
    expect(conflitos.map((c) => c.severidade)).toEqual([
      SeveridadeConflito.POTENCIAL,
      SeveridadeConflito.POTENCIAL,
    ]);
    expect(conflitos.map((c) => c.contexto[0]).sort()).toEqual(['p1', 'p2']);
  });
});
