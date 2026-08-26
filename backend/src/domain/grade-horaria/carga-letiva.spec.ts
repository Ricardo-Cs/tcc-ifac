import { cargaLetivaPorProfessor } from './carga-letiva';
import {
  alocacao,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from './fixtures';

describe('cargaLetivaPorProfessor', () => {
  it('devolve zero para professor sem nenhuma alocação', () => {
    const snapshot = montarSnapshot({ professores: [professor({ id: 'p1' })] });

    expect(cargaLetivaPorProfessor(snapshot).get('p1')).toBe(0);
  });

  it('converte aulas de 50min em horas de 60min', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's2' }),
      ],
    });

    expect(cargaLetivaPorProfessor(snapshot).get('p1')).toBeCloseTo(
      (2 * 50) / 60,
    );
  });

  it('pesa a codocência pela proporção de carga', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [{ professorId: 'p1', proporcaoCarga: 50 }],
        }),
      ],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
    });

    expect(cargaLetivaPorProfessor(snapshot).get('p1')).toBeCloseTo(
      50 / 60 / 2,
    );
  });
});
