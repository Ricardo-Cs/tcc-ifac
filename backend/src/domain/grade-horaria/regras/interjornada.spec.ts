import { Turno } from '../../academico/enums';
import { chaveConflito } from '../chave-conflito';
import { SeveridadeConflito, TipoConflito } from '../conflito';
import {
  alocacao,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from '../fixtures';
import { RegraInterjornada } from './interjornada';

const noiteQuinta = slot({
  id: 'qui-n4',
  codigo: 'QUI-N4',
  diaSemana: 4,
  turno: Turno.NOITE,
  ordem: 4,
  horaInicio: '21:30:00',
  horaFim: '22:20:00',
});

const manhaSexta = slot({
  id: 'sex-m1',
  codigo: 'SEX-M1',
  diaSemana: 5,
  turno: Turno.MANHA,
  ordem: 1,
  horaInicio: '07:30:00',
  horaFim: '08:20:00',
});

const tardeQuinta = slot({
  id: 'qui-t5',
  codigo: 'QUI-T5',
  diaSemana: 4,
  turno: Turno.TARDE,
  ordem: 5,
  horaInicio: '17:10:00',
  horaFim: '18:00:00',
});

describe('RegraInterjornada', () => {
  const regra = new RegraInterjornada();

  it('não acende quando há 11h ou mais entre a última aula e a primeira do dia seguinte', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [tardeQuinta, manhaSexta],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'qui-t5' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'sex-m1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('acende FORTE quando a noite emenda com a manhã seguinte', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1', nome: 'Jonas' })],
      turmas: [turma({ id: 't1' })],
      slots: [noiteQuinta, manhaSexta],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'qui-n4' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'sex-m1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.INTERJORNADA_VIOLADA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
    expect(conflitos[0].mensagem).toContain('9h10');
    expect(conflitos[0].mensagem).toContain('Jonas');
  });

  it('não compara dias que não são consecutivos', () => {
    const segunda = slot({
      id: 'seg-n4',
      diaSemana: 1,
      turno: Turno.NOITE,
      ordem: 4,
      horaInicio: '21:30:00',
      horaFim: '22:20:00',
    });
    const quarta = slot({
      id: 'qua-m1',
      diaSemana: 3,
      turno: Turno.MANHA,
      ordem: 1,
      horaInicio: '07:30:00',
      horaFim: '08:20:00',
    });
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [segunda, quarta],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'seg-n4' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'qua-m1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('rebaixa para POTENCIAL quando alguma oferta envolvida tem codocência', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      turmas: [turma({ id: 't1' })],
      slots: [noiteQuinta, manhaSexta],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 70 },
            { professorId: 'p2', proporcaoCarga: 30 },
          ],
        }),
        oferta({ id: 'o2', turmaId: 't1', professorIds: ['p1'] }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'qui-n4' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 'sex-m1' }),
      ],
    });

    const conflitos = regra
      .avaliar(snapshot)
      .filter((c) => c.contexto[0] === 'p1');

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
  });

  it('identifica o conflito pelas aulas de borda, não pelo id da linha', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [noiteQuinta, manhaSexta],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 'qui-n4' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 'sex-m1' }),
      ],
    });

    const [conflito] = regra.avaliar(snapshot);

    expect(
      [...conflito.participantes].sort((x, y) =>
        x.slotId.localeCompare(y.slotId),
      ),
    ).toEqual([
      { ofertaId: 'o1', slotId: 'qui-n4' },
      { ofertaId: 'o1', slotId: 'sex-m1' },
    ]);
    expect(chaveConflito(conflito)).toContain('dias-4-5');
  });
});
