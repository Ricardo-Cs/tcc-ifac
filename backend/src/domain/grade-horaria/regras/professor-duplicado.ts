import { Conflito, SeveridadeConflito, TipoConflito } from '../conflito';
import { AlocacaoSnapshot, GradeSnapshot } from '../snapshot';
import { Regra } from './regra';

/**
 * PROFESSOR_DUPLICADO / PROFESSOR_DUPLICADO_POTENCIAL — o mesmo professor
 * envolvido em duas ou mais ofertas DISTINTAS alocadas no mesmo slot.
 *
 * A severidade depende da codocência:
 *   - todas as ofertas envolvidas têm um único professor  -> FORTE (colisão certa)
 *   - alguma oferta envolvida tem codocência               -> POTENCIAL
 *     (pode ser resolvível internamente; a comissão avalia)
 *
 * Comparar ofertas distintas, não alocações: duas alocações da MESMA oferta no
 * mesmo slot são a mesma aula (o professor está num lugar só) — isso é problema
 * de TURMA_DUPLICADA, não deste.
 */
export class RegraProfessorDuplicado implements Regra {
    readonly tipo = TipoConflito.PROFESSOR_DUPLICADO;

    avaliar(snapshot: GradeSnapshot): Conflito[] {
        const conflitos: Conflito[] = [];

        for (const [chave, alocacoes] of snapshot.porProfessorSlot) {
            // Ofertas distintas alocadas neste slot que incluem este professor.
            const ofertaIds = new Set(alocacoes.map((a) => a.ofertaId));
            if (ofertaIds.size < 2) continue;

            // chave = `${professorId}:${slotId}`
            const [professorId, slotId] = chave.split(':');
            const professor = snapshot.professores.get(professorId);
            const slot = snapshot.slots.get(slotId);
            const nomeProfessor = professor?.nome ?? professorId;
            const nomeSlot = slot?.codigo ?? slotId;

            const haCodocencia = [...ofertaIds].some((id) => {
                const oferta = snapshot.ofertas.get(id);
                return (oferta?.professorIds.length ?? 0) > 1;
            });

            conflitos.push(
                haCodocencia
                    ? this.potencial(nomeProfessor, nomeSlot, alocacoes)
                    : this.forte(nomeProfessor, nomeSlot, alocacoes),
            );
        }

        return conflitos;
    }

    private forte(
        professor: string,
        slot: string,
        alocacoes: AlocacaoSnapshot[],
    ): Conflito {
        return {
            tipo: TipoConflito.PROFESSOR_DUPLICADO,
            severidade: SeveridadeConflito.FORTE,
            alocacoesEnvolvidas: alocacoes.map((a) => a.id),
            mensagem:
                `O professor ${professor} está em mais de uma aula no mesmo horário ` +
                `(${slot}).`,
        };
    }

    private potencial(
        professor: string,
        slot: string,
        alocacoes: AlocacaoSnapshot[],
    ): Conflito {
        return {
            tipo: TipoConflito.PROFESSOR_DUPLICADO_POTENCIAL,
            severidade: SeveridadeConflito.POTENCIAL,
            alocacoesEnvolvidas: alocacoes.map((a) => a.id),
            mensagem:
                `O professor ${professor} pode ter conflito no horário ${slot}: há ` +
                `codocência em pelo menos uma das ofertas, então a comissão avalia.`,
        };
    }
}
