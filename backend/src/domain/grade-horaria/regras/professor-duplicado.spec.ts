import { SeveridadeConflito, TipoConflito } from '../conflito';
import { chaveConflito } from '../chave-conflito';
import { alocacao, montarSnapshot, oferta, professor, slot } from '../fixtures';
import { RegraProfessorDuplicado } from './professor-duplicado';

describe('RegraProfessorDuplicado', () => {
  const regra = new RegraProfessorDuplicado();

  it('não gera conflito quando o professor tem uma aula por slot', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' }), slot({ id: 's2' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }),
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's2' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('gera conflito FORTE quando o professor tem 100% da carga nas duas ofertas do mesmo slot', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1', nome: 'Jonas' })],
      slots: [slot({ id: 's1', codigo: 'SEG-T1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }), // atalho: 100%
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.PROFESSOR_DUPLICADO);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
    // Participantes por coordenada semântica; o professor entra no contexto.
    expect(
      [...conflitos[0].participantes].sort((x, y) =>
        x.ofertaId.localeCompare(y.ofertaId),
      ),
    ).toEqual([
      { ofertaId: 'o1', slotId: 's1' },
      { ofertaId: 'o2', slotId: 's1' },
    ]);
    expect(conflitos[0].contexto).toEqual(['p1', 's1']);
    expect(conflitos[0].mensagem).toContain('Jonas');
    expect(conflitos[0].mensagem).toContain('SEG-T1');
  });

  it('gera conflito POTENCIAL quando a carga do professor é repartida (70/30) em alguma oferta', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        // codocência 70/30: p1 não detém a oferta inteira
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 70 },
            { professorId: 'p2', proporcaoCarga: 30 },
          ],
        }),
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }), // 100%
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    // p1 colide, mas tem só 70% em o1 -> POTENCIAL. Tipo continua o mesmo:
    // a potencialidade é severidade, não tipo.
    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.PROFESSOR_DUPLICADO);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
  });

  it('gera conflito POTENCIAL quando a oferta é dividida entre três professores', () => {
    const snapshot = montarSnapshot({
      professores: [
        professor({ id: 'p1' }),
        professor({ id: 'p2' }),
        professor({ id: 'p3' }),
      ],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 34 },
            { professorId: 'p2', proporcaoCarga: 33 },
            { professorId: 'p3', proporcaoCarga: 33 },
          ],
        }),
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }), // 100%
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    // p1 tem 34% em o1 -> a colisão é potencial (a comissão avalia se os
    // codocentes cobrem a aula).
    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
  });

  it('não confunde duas alocações da MESMA oferta no mesmo slot (dedup por oferta)', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's1' }),
      ],
    });

    // Mesma oferta = mesma aula, professor num lugar só. Não é conflito de professor.
    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('não confunde professores diferentes no mesmo slot', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }),
        oferta({ id: 'o2', turmaId: 't2', professorIds: ['p2'] }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
      ],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('emite um conflito por professor quando dois professores colidem em codocência', () => {
    const snapshot = montarSnapshot({
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 50 },
            { professorId: 'p2', proporcaoCarga: 50 },
          ],
        }),
        oferta({
          id: 'o2',
          turmaId: 't2',
          professores: [
            { professorId: 'p1', proporcaoCarga: 50 },
            { professorId: 'p2', proporcaoCarga: 50 },
          ],
        }),
      ],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
      ],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(2);
    expect(
      conflitos.every((c) => c.severidade === SeveridadeConflito.POTENCIAL),
    ).toBe(true);
    // Os dois conflitos têm participantes e tipo idênticos: o discriminador é
    // o professor no contexto. Suas chaves NÃO podem colidir — senão um único
    // aceite quitaria os dois.
    const chaves = new Set(conflitos.map((c) => chaveConflito(c)));
    expect(chaves.size).toBe(2);
  });

  it('FORTE e POTENCIAL do mesmo arranjo produzem a MESMA chave (severidade fora da identidade)', () => {
    // Mesmíssimo professor, slot e ofertas nos dois cenários. Só a proporção de
    // carga muda — logo só a severidade muda. A chave TEM de ser idêntica: se
    // ela mudasse, mover de 70/30 para 100/100 (ou vice-versa) invalidaria um
    // aceite já registrado pela comissão.
    const arranjo = (proporcaoEmO1: number) =>
      montarSnapshot({
        professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
        slots: [slot({ id: 's1' })],
        ofertas: [
          oferta({
            id: 'o1',
            turmaId: 't1',
            professores:
              proporcaoEmO1 >= 100
                ? [{ professorId: 'p1', proporcaoCarga: 100 }]
                : [
                    { professorId: 'p1', proporcaoCarga: proporcaoEmO1 },
                    { professorId: 'p2', proporcaoCarga: 100 - proporcaoEmO1 },
                  ],
          }),
          oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1'] }),
        ],
        alocacoes: [
          alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
          alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
        ],
      });

    const forte = regra.avaliar(arranjo(100));
    const potencial = regra.avaliar(arranjo(70));

    expect(forte[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(potencial[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
    // Severidades distintas, MESMA chave.
    expect(chaveConflito(forte[0])).toBe(chaveConflito(potencial[0]));
  });

  it('lida com grade vazia', () => {
    expect(regra.avaliar(montarSnapshot({}))).toEqual([]);
  });
});
