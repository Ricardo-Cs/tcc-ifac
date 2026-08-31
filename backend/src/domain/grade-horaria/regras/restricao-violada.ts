import {
  Conflito,
  ParticipanteConflito,
  SeveridadeConflito,
  TipoConflito,
} from '../conflito';
import { AlocacaoSnapshot, GradeSnapshot } from '../snapshot';
import { Regra } from './regra';

/**
 * RESTRICAO_VIOLADA — uma aula alocada num slot em que o próprio professor
 * declarou restrição (formulário de disponibilidade).
 *
 * SEMPRE o tipo RESTRICAO_VIOLADA; o que muda é a SEVERIDADE, decidida pelo
 * `amparoLegal` da restrição:
 *   - amparada por dispositivo legal (Art. 98 da Lei 8.112/90 etc.) -> FORTE:
 *     inegociável, não é caso de "aceitar", é caso de mover a aula.
 *   - preferência pessoal (consulta médica, buscar filho na escola etc.)   ->
 *     POTENCIAL: real, mas a comissão avalia — pode aceitar com justificativa
 *     quando não houver alternativa de horário.
 *
 * Manter o tipo fixo (em vez de um enum à parte) preserva a chave de
 * identidade caso a mesma restrição oscile de amparo legal sem a aula mudar
 * de slot — o aceite não se perde na oscilação.
 */
export class RegraRestricaoViolada implements Regra {
  readonly tipo = TipoConflito.RESTRICAO_VIOLADA;

  avaliar(snapshot: GradeSnapshot): Conflito[] {
    if (!snapshot.coletaImportada) return [];

    const conflitos: Conflito[] = [];

    for (const [chave, amparoLegal] of snapshot.restricoes) {
      const alocacoes = snapshot.porProfessorSlot.get(chave);
      if (!alocacoes || alocacoes.length === 0) continue;

      // chave = `${professorId}:${slotId}`
      const [professorId, slotId] = chave.split(':');
      const professor = snapshot.professores.get(professorId);
      const slot = snapshot.slots.get(slotId);
      const nomeProfessor = professor?.nome ?? professorId;
      const nomeSlot = slot?.codigo ?? slotId;

      // Dedup por oferta: a MESMA oferta geminada não vira dois participantes.
      const ofertaIds = new Set(alocacoes.map((a) => a.ofertaId));
      const participantes = [...ofertaIds].map((ofertaId) => ({
        ofertaId,
        slotId,
      }));

      conflitos.push(
        amparoLegal
          ? this.forte(nomeProfessor, nomeSlot, alocacoes, participantes, [
              professorId,
              slotId,
            ])
          : this.potencial(nomeProfessor, nomeSlot, alocacoes, participantes, [
              professorId,
              slotId,
            ]),
      );
    }

    return conflitos;
  }

  private forte(
    professor: string,
    slot: string,
    alocacoes: AlocacaoSnapshot[],
    participantes: ParticipanteConflito[],
    contexto: string[],
  ): Conflito {
    return {
      tipo: TipoConflito.RESTRICAO_VIOLADA,
      severidade: SeveridadeConflito.FORTE,
      participantes,
      contexto,
      alocacoesEnvolvidas: alocacoes.map((a) => a.id),
      mensagem: `${professor} tem restrição legal de horário em ${slot}.`,
    };
  }

  private potencial(
    professor: string,
    slot: string,
    alocacoes: AlocacaoSnapshot[],
    participantes: ParticipanteConflito[],
    contexto: string[],
  ): Conflito {
    return {
      tipo: TipoConflito.RESTRICAO_VIOLADA,
      severidade: SeveridadeConflito.POTENCIAL,
      participantes,
      contexto,
      alocacoesEnvolvidas: alocacoes.map((a) => a.id),
      mensagem: `${professor} pediu para não ter aula em ${slot} (restrição pessoal).`,
    };
  }
}
