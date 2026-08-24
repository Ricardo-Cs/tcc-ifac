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
import { RegraIntrajornada } from './intrajornada';

const manha5 = slot({
  id: 'seg-m5',
  diaSemana: 1,
  turno: Turno.MANHA,
  ordem: 5,
  horaInicio: '11:10:00',
  horaFim: '12:00:00',
});

const tarde1 = slot({
  id: 'seg-t1',
  diaSemana: 1,
  turno: Turno.TARDE,
  ordem: 1,
  horaInicio: '13:30:00',
  horaFim: '14:20:00',
});

const tarde3 = slot({
  id: 'seg-t3',
  diaSemana: 1,
  turno: Turno.TARDE,
  ordem: 3,
  horaInicio: '15:10:00',
  horaFim: '16:00:00',
});

const tarde4 = slot({
  id: 'seg-t4',
  diaSemana: 1,
  turno: Turno.TARDE,
  ordem: 4,
  horaInicio: '16:20:00',
  horaFim: '17:10:00',
});

const tarde5 = slot({
  id: 'seg-t5',
  diaSemana: 1,
  turno: Turno.TARDE,
  ordem: 5,
  horaInicio: '17:10:00',
  horaFim: '18:00:00',
});

const noite1 = slot({
  id: 'seg-n1',
  diaSemana: 1,
  turno: Turno.NOITE,
  ordem: 1,
  horaInicio: '18:50:00',
  horaFim: '19:40:00',
});

describe('RegraIntrajornada', () => {
  const regra = new RegraIntrajornada();

  it('não acende quando o intervalo entre turnos chega a 1h', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [manha5, tarde1],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'seg-m5' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'seg-t1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('acende FORTE quando a tarde emenda com a noite em menos de 1h', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1', nome: 'Marlon' })],
      turmas: [turma({ id: 't1' })],
      slots: [tarde5, noite1],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'seg-t5' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'seg-n1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.INTRAJORNADA_VIOLADA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
    expect(conflitos[0].mensagem).toContain('50min');
  });

  it('ignora o intervalo interno do turno, que não é troca de jornada', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [tarde3, tarde4],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'seg-t3' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'seg-t4' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('rebaixa para POTENCIAL quando alguma oferta envolvida tem codocência', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      turmas: [turma({ id: 't1' })],
      slots: [tarde5, noite1],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 50 },
            { professorId: 'p2', proporcaoCarga: 50 },
          ],
        }),
        oferta({ id: 'o2', turmaId: 't1', professorIds: ['p1'] }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'seg-t5' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 'seg-n1' }),
      ],
    });

    const conflitos = regra
      .avaliar(snapshot)
      .filter((c) => c.contexto[0] === 'p1');

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
  });
});
