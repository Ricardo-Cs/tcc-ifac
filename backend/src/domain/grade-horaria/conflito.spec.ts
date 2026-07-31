import { chaveConflito, SeveridadeConflito, TipoConflito } from './conflito';

describe('chaveConflito', () => {
    it('é independente da ordem em que as alocações foram listadas', () => {
        const a = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a2', 'a1'],
        });
        const b = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a1', 'a2'],
        });

        expect(a).toBe(b);
        expect(a).toBe('PROFESSOR_DUPLICADO|a1,a2');
    });

    it('não muta o array de entrada ao ordenar', () => {
        const alocacoes = ['a2', 'a1'];
        chaveConflito({ tipo: TipoConflito.TURMA_DUPLICADA, alocacoesEnvolvidas: alocacoes });
        expect(alocacoes).toEqual(['a2', 'a1']);
    });

    it('distingue tipos diferentes sobre as mesmas alocações', () => {
        const professor = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a1', 'a2'],
        });
        const turma = chaveConflito({
            tipo: TipoConflito.TURMA_DUPLICADA,
            alocacoesEnvolvidas: ['a1', 'a2'],
        });

        expect(professor).not.toBe(turma);
    });

    it('muda quando uma alocação envolvida é substituída (aula movida)', () => {
        const antes = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a1', 'a2'],
        });
        const depois = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a1', 'a3'],
        });

        expect(antes).not.toBe(depois);
    });

    it('não depende da severidade (mesmo tipo pode variar de severidade sem mudar identidade)', () => {
        // chaveConflito só olha tipo + alocações; severidade nem entra na assinatura.
        const chave = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            alocacoesEnvolvidas: ['a1', 'a2'],
        });
        expect(chave).not.toContain(SeveridadeConflito.FORTE);
    });
});
