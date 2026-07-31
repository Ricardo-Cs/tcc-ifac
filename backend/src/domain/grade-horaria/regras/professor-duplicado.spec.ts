import { SeveridadeConflito, TipoConflito } from '../conflito';
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

    it('gera conflito FORTE quando o professor dá duas ofertas de professor único no mesmo slot', () => {
        const snapshot = montarSnapshot({
            professores: [professor({ id: 'p1', nome: 'Jonas' })],
            slots: [slot({ id: 's1', codigo: 'SEG-T1' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }),
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
        expect(conflitos[0].mensagem).toContain('Jonas');
        expect(conflitos[0].mensagem).toContain('SEG-T1');
    });

    it('gera conflito POTENCIAL quando alguma das ofertas tem codocência', () => {
        const snapshot = montarSnapshot({
            professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
            slots: [slot({ id: 's1' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] }),
                oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1', 'p2'] }), // codocência
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
            ],
        });

        const conflitos = regra.avaliar(snapshot);

        // p1 aparece nas duas ofertas e uma tem codocência -> POTENCIAL.
        expect(conflitos).toHaveLength(1);
        expect(conflitos[0].tipo).toBe(TipoConflito.PROFESSOR_DUPLICADO_POTENCIAL);
        expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
    });

    it('não confunde duas alocações da MESMA oferta no mesmo slot (aula geminada mal-modelada)', () => {
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
                oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1', 'p2'] }),
                oferta({ id: 'o2', turmaId: 't2', professorIds: ['p1', 'p2'] }),
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
            ],
        });

        const conflitos = regra.avaliar(snapshot);

        expect(conflitos).toHaveLength(2);
        expect(conflitos.every((c) => c.severidade === SeveridadeConflito.POTENCIAL)).toBe(true);
    });

    it('lida com grade vazia', () => {
        expect(regra.avaliar(montarSnapshot({}))).toEqual([]);
    });
});
