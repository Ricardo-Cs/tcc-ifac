import { chaveConflito } from './chave-conflito';
import {
    Conflito,
    ParticipanteConflito,
    SeveridadeConflito,
    TipoConflito,
} from './conflito';

// Dois participantes num mesmo slot — o caso típico de PROFESSOR/TURMA_DUPLICADA.
const p = (ofertaId: string, slotId: string): ParticipanteConflito => ({ ofertaId, slotId });

describe('chaveConflito', () => {
    it('é order-independent: (A,B) produz a mesma chave que (B,A)', () => {
        const ab = chaveConflito({
            tipo: TipoConflito.TURMA_DUPLICADA,
            contexto: ['slot-1'],
            participantes: [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')],
        });
        const ba = chaveConflito({
            tipo: TipoConflito.TURMA_DUPLICADA,
            contexto: ['slot-1'],
            participantes: [p('oferta-B', 'slot-1'), p('oferta-A', 'slot-1')],
        });

        expect(ab).toBe(ba);
    });

    it('não muta o array de participantes ao ordenar', () => {
        const participantes = [p('oferta-B', 'slot-1'), p('oferta-A', 'slot-1')];
        chaveConflito({ tipo: TipoConflito.TURMA_DUPLICADA, contexto: ['slot-1'], participantes });
        expect(participantes.map((x) => x.ofertaId)).toEqual(['oferta-B', 'oferta-A']);
    });

    it('muda quando uma aula muda de slot (o contexto expira)', () => {
        // Mesma linha de alocação movida: no write model o id não muda, mas o
        // slotId sim. A chave TEM de mudar para o aceite antigo deixar de casar.
        const antes = chaveConflito({
            tipo: TipoConflito.TURMA_DUPLICADA,
            contexto: ['slot-1'],
            participantes: [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')],
        });
        const depois = chaveConflito({
            tipo: TipoConflito.TURMA_DUPLICADA,
            contexto: ['slot-2'],
            participantes: [p('oferta-A', 'slot-2'), p('oferta-B', 'slot-1')],
        });

        expect(antes).not.toBe(depois);
    });

    it('é estável quando nada de relevante muda (sobrevive ao recálculo)', () => {
        const descritor = {
            tipo: TipoConflito.TURMA_DUPLICADA,
            contexto: ['slot-1'],
            participantes: [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')],
        };
        // Recalcular do zero (outro objeto, mesma situação) dá a MESMA chave.
        expect(chaveConflito(descritor)).toBe(chaveConflito({ ...descritor }));
    });

    it('distingue tipos diferentes sobre os mesmos participantes/contexto', () => {
        const base = {
            contexto: ['slot-1'],
            participantes: [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')],
        };
        const professor = chaveConflito({ tipo: TipoConflito.PROFESSOR_DUPLICADO, ...base });
        const turma = chaveConflito({ tipo: TipoConflito.TURMA_DUPLICADA, ...base });

        expect(professor).not.toBe(turma);
    });

    it('distingue os dois conflitos de codocência pelo professor no contexto', () => {
        // Dois professores nas MESMAS ofertas/slot: mesmos participantes e tipo
        // (PROFESSOR_DUPLICADO único), discriminados só pelo professorId no
        // contexto. As chaves não podem colidir.
        const participantes = [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')];
        const doP1 = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            contexto: ['prof-1', 'slot-1'],
            participantes,
        });
        const doP2 = chaveConflito({
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            contexto: ['prof-2', 'slot-1'],
            participantes,
        });

        expect(doP1).not.toBe(doP2);
    });

    it('não depende da severidade: dois conflitos iguais em tudo menos severidade têm a MESMA chave', () => {
        // O ponto inteiro do colapso do tipo _POTENCIAL: um professor-duplicado
        // que oscila FORTE<->POTENCIAL (codocência adicionada/removida) sem a aula
        // mudar de slot é o MESMO conflito — a chave tem de sobreviver.
        const base = {
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            contexto: ['prof-1', 'slot-1'],
            participantes: [p('oferta-A', 'slot-1'), p('oferta-B', 'slot-1')],
            alocacoesEnvolvidas: ['aloc-1', 'aloc-2'],
            mensagem: 'irrelevante',
        };
        const forte: Conflito = { ...base, severidade: SeveridadeConflito.FORTE };
        const potencial: Conflito = { ...base, severidade: SeveridadeConflito.POTENCIAL };

        expect(chaveConflito(forte)).toBe(chaveConflito(potencial));
        // E a severidade nem aparece na string da chave.
        expect(chaveConflito(forte)).not.toContain(SeveridadeConflito.FORTE);
    });

    it('leva a sala na identidade quando a regra a considera (undefined != null)', () => {
        const comSala = chaveConflito({
            tipo: TipoConflito.SALA_OCUPADA,
            contexto: ['slot-1'],
            participantes: [{ ofertaId: 'oferta-A', slotId: 'slot-1', salaId: 'sala-1' }],
        });
        const semSala = chaveConflito({
            tipo: TipoConflito.SALA_OCUPADA,
            contexto: ['slot-1'],
            participantes: [{ ofertaId: 'oferta-A', slotId: 'slot-1', salaId: null }],
        });
        const salaIgnorada = chaveConflito({
            tipo: TipoConflito.SALA_OCUPADA,
            contexto: ['slot-1'],
            participantes: [{ ofertaId: 'oferta-A', slotId: 'slot-1' }],
        });

        expect(comSala).not.toBe(semSala);
        expect(semSala).not.toBe(salaIgnorada);
    });
});
