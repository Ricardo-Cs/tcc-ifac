import { Turno } from '../../academico/enums';
import { SeveridadeConflito, TipoConflito } from '../conflito';
import { SlotSnapshot } from '../snapshot';
import {
  alocacao,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from '../fixtures';
import { RegraCargaDiariaExcedida } from './carga-diaria-excedida';

const MANHA = ['07:30', '08:20', '09:10', '10:20', '11:10'];
const TARDE = ['13:30', '14:20', '15:10', '16:20', '17:10'];

function somarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

function slotsDoDia(): SlotSnapshot[] {
  const monta = (inicios: string[], turno: Turno, prefixo: string) =>
    inicios.map((inicio, i) =>
      slot({
        id: `${prefixo}${i + 1}`,
        diaSemana: 1,
        turno,
        ordem: i + 1,
        horaInicio: `${inicio}:00`,
        horaFim: somarMinutos(inicio, 50),
      }),
    );
  return [...monta(MANHA, Turno.MANHA, 'm'), ...monta(TARDE, Turno.TARDE, 't')];
}

function snapshotCom(slotIds: string[], professores?: string[]) {
  return montarSnapshot({
    professores: [professor({ id: 'p1', nome: 'Jonas' })],
    turmas: [turma({ id: 't1' })],
    slots: slotsDoDia(),
    ofertas: [
      oferta({
        id: 'o1',
        turmaId: 't1',
        professorIds: professores ?? ['p1'],
      }),
    ],
    alocacoes: slotIds.map((slotId, i) =>
      alocacao({ id: `a${i + 1}`, ofertaId: 'o1', slotId }),
    ),
  });
}

describe('RegraCargaDiariaExcedida', () => {
  const regra = new RegraCargaDiariaExcedida();

  it('não acende com 9 aulas no dia (7h30, dentro do teto de 8h)', () => {
    const noveSlots = ['m1', 'm2', 'm3', 'm4', 'm5', 't1', 't2', 't3', 't4'];

    expect(regra.avaliar(snapshotCom(noveSlots))).toEqual([]);
  });

  it('acende FORTE com 10 aulas no dia (8h20)', () => {
    const dezSlots = [
      'm1',
      'm2',
      'm3',
      'm4',
      'm5',
      't1',
      't2',
      't3',
      't4',
      't5',
    ];

    const conflitos = regra.avaliar(snapshotCom(dezSlots));

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.CARGA_DIARIA_EXCEDIDA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].mensagem).toContain('10 aulas');
    expect(conflitos[0].mensagem).toContain('8h20');
  });

  it('conta o slot uma vez só quando duas ofertas o ocupam', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
      slots: slotsDoDia(),
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }),
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }),
      ],
      alocacoes: [
        ...['m1', 'm2', 'm3', 'm4', 'm5', 't1', 't2', 't3', 't4'].map(
          (slotId, i) => alocacao({ id: `a${i + 1}`, ofertaId: 'o1', slotId }),
        ),
        alocacao({ id: 'extra', ofertaId: 'o2', slotId: 't4' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });
});
