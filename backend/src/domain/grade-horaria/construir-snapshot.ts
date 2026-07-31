import {
    AlocacaoSnapshot,
    DadosSnapshot,
    GradeSnapshot,
    Id,
    chaveProfessorSlot,
    chaveTurmaSlot,
} from './snapshot';

/** Adiciona `valor` à lista da chave `chave`, criando a lista se necessário. */
function agrupar<K, V>(mapa: Map<K, V[]>, chave: K, valor: V): void {
    const lista = mapa.get(chave);
    if (lista) {
        lista.push(valor);
    } else {
        mapa.set(chave, [valor]);
    }
}

/**
 * Monta o snapshot completo a partir dos dados brutos, computando os índices
 * uma única vez. É a única forma de obter um `GradeSnapshot` — garante que os
 * índices estejam sempre coerentes com as alocações.
 *
 * Serve tanto ao loader de `infrastructure` quanto aos testes, que montam os
 * dados brutos literais e deixam a fábrica derivar os índices.
 */
export function construirSnapshot(dados: DadosSnapshot): GradeSnapshot {
    const porSlot = new Map<Id, AlocacaoSnapshot[]>();
    const porProfessorSlot = new Map<string, AlocacaoSnapshot[]>();
    const porTurmaSlot = new Map<string, AlocacaoSnapshot[]>();

    for (const alocacao of dados.alocacoes) {
        agrupar(porSlot, alocacao.slotId, alocacao);

        const oferta = dados.ofertas.get(alocacao.ofertaId);
        if (!oferta) {
            // Alocação órfã: sem oferta resolvida não há turma nem professores a
            // indexar. Fica só em porSlot; as regras que dependem da oferta a ignoram.
            continue;
        }

        agrupar(porTurmaSlot, chaveTurmaSlot(oferta.turmaId, alocacao.slotId), alocacao);

        for (const professorId of oferta.professorIds) {
            agrupar(
                porProfessorSlot,
                chaveProfessorSlot(professorId, alocacao.slotId),
                alocacao,
            );
        }
    }

    return { ...dados, porSlot, porProfessorSlot, porTurmaSlot };
}
