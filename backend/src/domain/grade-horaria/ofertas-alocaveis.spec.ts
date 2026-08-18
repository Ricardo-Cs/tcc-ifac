import { alocacao, montarSnapshot, oferta, slot, turma } from './fixtures';
import { ofertasAlocaveis } from './ofertas-alocaveis';

describe('ofertasAlocaveis', () => {
  it('lista a oferta sem nenhuma alocação com a carga inteira restante', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', aulasSemana: 4 })],
      alocacoes: [],
    });

    expect(ofertasAlocaveis(snapshot)).toEqual([
      { ofertaId: 'o1', aulasSemana: 4, aulasAlocadas: 0, aulasRestantes: 4 },
    ]);
  });

  it('desconta as alocações existentes da carga restante', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', aulasSemana: 4 })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's2' }),
      ],
    });

    expect(ofertasAlocaveis(snapshot)).toEqual([
      { ofertaId: 'o1', aulasSemana: 4, aulasAlocadas: 2, aulasRestantes: 2 },
    ]);
  });

  it('omite a oferta com a carga já completa', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', aulasSemana: 2 })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's2' }),
      ],
    });

    expect(ofertasAlocaveis(snapshot)).toEqual([]);
  });

  it('omite a oferta excedida (mais alocações que aulasSemana)', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' }), slot({ id: 's3' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', aulasSemana: 2 })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's2' }),
        alocacao({ id: 'a3', ofertaId: 'o1', slotId: 's3' }),
      ],
    });

    // Excesso é diagnóstico de CARGA_OFERTA_INCOMPLETA, não item de catálogo.
    expect(ofertasAlocaveis(snapshot)).toEqual([]);
  });

  it('separa a contagem por oferta e devolve só as com falta', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({ id: 'completa', turmaId: 't1', aulasSemana: 1 }),
        oferta({ id: 'parcial', turmaId: 't1', aulasSemana: 3 }),
        oferta({ id: 'zerada', turmaId: 't1', aulasSemana: 2 }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'completa', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'parcial', slotId: 's1' }),
      ],
    });

    const resultado = ofertasAlocaveis(snapshot);

    expect(resultado.map((o) => o.ofertaId).sort()).toEqual([
      'parcial',
      'zerada',
    ]);
    expect(resultado.find((o) => o.ofertaId === 'parcial')).toEqual({
      ofertaId: 'parcial',
      aulasSemana: 3,
      aulasAlocadas: 1,
      aulasRestantes: 2,
    });
    expect(resultado.find((o) => o.ofertaId === 'zerada')?.aulasRestantes).toBe(
      2,
    );
  });

  it('lida com grade vazia', () => {
    expect(ofertasAlocaveis(montarSnapshot({}))).toEqual([]);
  });
});
