import { SeveridadeConflito, TipoConflito } from '../conflito';
import { chaveConflito } from '../chave-conflito';
import {
  alocacao,
  montarSnapshot,
  oferta,
  sala,
  slot,
  turma,
} from '../fixtures';
import { RegraSalaOcupada } from './sala-ocupada';

describe('RegraSalaOcupada', () => {
  const regra = new RegraSalaOcupada();

  it('não gera conflito quando cada sala tem uma aula por slot', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
      salas: [sala({ id: 'sala1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1' }),
        oferta({ id: 'o2', turmaId: 't2' }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's2', salaId: 'sala1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('gera conflito FORTE quando duas ofertas ocupam a mesma sala no mesmo slot', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
      salas: [sala({ id: 'sala1', nome: 'LAB 3' })],
      slots: [slot({ id: 's1', codigo: 'SEG-T1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1' }),
        oferta({ id: 'o2', turmaId: 't2' }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1', salaId: 'sala1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.SALA_OCUPADA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
    // Participantes por coordenada semântica (oferta+slot+sala), não por id de linha.
    expect(
      [...conflitos[0].participantes].sort((x, y) =>
        x.ofertaId.localeCompare(y.ofertaId),
      ),
    ).toEqual([
      { ofertaId: 'o1', slotId: 's1', salaId: 'sala1' },
      { ofertaId: 'o2', slotId: 's1', salaId: 'sala1' },
    ]);
    expect(conflitos[0].contexto).toEqual(['sala1', 's1']);
    expect(conflitos[0].mensagem).toContain('LAB 3');
    expect(conflitos[0].mensagem).toContain('SEG-T1');
  });

  it('não confunde salas diferentes no mesmo slot', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
      salas: [sala({ id: 'sala1' }), sala({ id: 'sala2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1' }),
        oferta({ id: 'o2', turmaId: 't2' }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1', salaId: 'sala2' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('não acusa aulas SEM sala definida no mesmo slot', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1' }),
        oferta({ id: 'o2', turmaId: 't2' }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: null }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1', salaId: null }),
      ],
    });

    // Duas aulas sem sala não disputam sala nenhuma — não é SALA_OCUPADA.
    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('não acusa a "sala dupla" (mesma oferta em duas salas no mesmo slot)', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      salas: [sala({ id: 'lab3' }), sala({ id: 'lab4' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1' })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'lab3' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's1', salaId: 'lab4' }),
      ],
    });

    // Cada sala em seu bucket, e uma oferta só — a mesma aula em duas salas
    // (caso LAB 3/LAB 4 da grade real) é legítima, não conflito.
    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('não acusa a MESMA oferta gravada duas vezes na mesma sala/slot (duplicata de dados)', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      salas: [sala({ id: 'sala1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1' })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('não confunde aula geminada na mesma sala (slots distintos) com duplicata', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' })],
      salas: [sala({ id: 'sala1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1' })],
      alocacoes: [
        alocacao({
          id: 'a1',
          ofertaId: 'o1',
          slotId: 's1',
          salaId: 'sala1',
          grupoBloco: 'g1',
        }),
        alocacao({
          id: 'a2',
          ofertaId: 'o1',
          slotId: 's2',
          salaId: 'sala1',
          grupoBloco: 'g1',
        }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('detecta três ofertas na mesma sala/slot como um único conflito', () => {
    const snapshot = montarSnapshot({
      turmas: [turma({ id: 't1' }), turma({ id: 't2' }), turma({ id: 't3' })],
      salas: [sala({ id: 'sala1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1' }),
        oferta({ id: 'o2', turmaId: 't2' }),
        oferta({ id: 'o3', turmaId: 't3' }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1', salaId: 'sala1' }),
        alocacao({ id: 'a3', ofertaId: 'o3', slotId: 's1', salaId: 'sala1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2', 'a3']);
  });

  it('leva a sala na chave: o mesmo par de ofertas em salas distintas gera chaves distintas', () => {
    const base = {
      ofertaId: 'o1',
      slotId: 's1',
    };
    const chaveA = chaveConflito({
      tipo: TipoConflito.SALA_OCUPADA,
      contexto: ['sala1', 's1'],
      participantes: [
        { ...base, salaId: 'sala1' },
        { ofertaId: 'o2', slotId: 's1', salaId: 'sala1' },
      ],
    });
    const chaveB = chaveConflito({
      tipo: TipoConflito.SALA_OCUPADA,
      contexto: ['sala2', 's1'],
      participantes: [
        { ...base, salaId: 'sala2' },
        { ofertaId: 'o2', slotId: 's1', salaId: 'sala2' },
      ],
    });

    expect(chaveA).not.toBe(chaveB);
  });

  it('lida com grade vazia', () => {
    expect(regra.avaliar(montarSnapshot({}))).toEqual([]);
  });
});
