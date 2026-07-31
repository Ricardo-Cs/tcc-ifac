import { SeveridadeConflito, TipoConflito } from '../conflito';
import { alocacao, montarSnapshot, oferta, slot, turma } from '../fixtures';
import { RegraTurmaDuplicada } from './turma-duplicada';

describe('RegraTurmaDuplicada', () => {
    const regra = new RegraTurmaDuplicada();

    it('não gera conflito quando a turma tem uma aula por slot', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1' })],
            slots: [slot({ id: 's1' }), slot({ id: 's2' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1' }),
                oferta({ id: 'o2', turmaId: 't1' }),
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's2' }),
            ],
        });

        expect(regra.avaliar(snapshot)).toEqual([]);
    });

    it('gera conflito FORTE quando a mesma turma tem duas aulas no mesmo slot', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1', nome: 'SI 2026.1' })],
            slots: [slot({ id: 's1', codigo: 'SEG-T1' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1' }),
                oferta({ id: 'o2', turmaId: 't1' }),
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
            ],
        });

        const conflitos = regra.avaliar(snapshot);

        expect(conflitos).toHaveLength(1);
        expect(conflitos[0].tipo).toBe(TipoConflito.TURMA_DUPLICADA);
        expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
        expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
        expect(conflitos[0].mensagem).toContain('SI 2026.1');
        expect(conflitos[0].mensagem).toContain('SEG-T1');
    });

    it('não confunde turmas diferentes no mesmo slot', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1' }), turma({ id: 't2' })],
            slots: [slot({ id: 's1' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1' }),
                oferta({ id: 'o2', turmaId: 't2' }),
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
            ],
        });

        expect(regra.avaliar(snapshot)).toEqual([]);
    });

    it('não acusa quando é a MESMA oferta gravada duas vezes no mesmo slot (duplicata de dados)', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1' })],
            slots: [slot({ id: 's1' })],
            ofertas: [oferta({ id: 'o1', turmaId: 't1' })],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's1' }),
            ],
        });

        // Mesma aula duas vezes não é "turma em duas disciplinas" — não é TURMA_DUPLICADA.
        expect(regra.avaliar(snapshot)).toEqual([]);
    });

    it('não confunde aula geminada (mesma turma, slots distintos) com duplicata', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1' })],
            slots: [slot({ id: 's1' }), slot({ id: 's2' })],
            ofertas: [oferta({ id: 'o1', turmaId: 't1' })],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1', grupoBloco: 'g1' }),
                alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's2', grupoBloco: 'g1' }),
            ],
        });

        expect(regra.avaliar(snapshot)).toEqual([]);
    });

    it('detecta três aulas da mesma turma no mesmo slot como um único conflito', () => {
        const snapshot = montarSnapshot({
            turmas: [turma({ id: 't1' })],
            slots: [slot({ id: 's1' })],
            ofertas: [
                oferta({ id: 'o1', turmaId: 't1' }),
                oferta({ id: 'o2', turmaId: 't1' }),
                oferta({ id: 'o3', turmaId: 't1' }),
            ],
            alocacoes: [
                alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
                alocacao({ id: 'a2', ofertaId: 'o2', slotId: 's1' }),
                alocacao({ id: 'a3', ofertaId: 'o3', slotId: 's1' }),
            ],
        });

        const conflitos = regra.avaliar(snapshot);

        expect(conflitos).toHaveLength(1);
        expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2', 'a3']);
    });

    it('lida com grade vazia', () => {
        expect(regra.avaliar(montarSnapshot({}))).toEqual([]);
    });
});
