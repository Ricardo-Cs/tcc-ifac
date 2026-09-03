import {
  ConflitoForteNaoAceitavelError,
  chaveDoAceite,
} from './aceite-conflito';
import { chaveConflito } from './chave-conflito';
import { Conflito, SeveridadeConflito, TipoConflito } from './conflito';

function conflito(
  severidade: SeveridadeConflito,
  tipo: TipoConflito,
): Conflito {
  return {
    tipo,
    severidade,
    contexto: ['prof-1', 'slot-1'],
    participantes: [
      { ofertaId: 'oferta-A', slotId: 'slot-1' },
      { ofertaId: 'oferta-B', slotId: 'slot-1' },
    ],
    alocacoesEnvolvidas: ['aloc-1', 'aloc-2'],
    mensagem: 'irrelevante para o teste',
  };
}

describe('chaveDoAceite', () => {
  it('rejeita aceitar um conflito FORTE', () => {
    const forte = conflito(
      SeveridadeConflito.FORTE,
      TipoConflito.TURMA_DUPLICADA,
    );
    expect(() => chaveDoAceite(forte)).toThrow(ConflitoForteNaoAceitavelError);
  });

  it('devolve a chave para um conflito POTENCIAL', () => {
    const potencial = conflito(
      SeveridadeConflito.POTENCIAL,
      TipoConflito.PROFESSOR_DUPLICADO,
    );
    expect(chaveDoAceite(potencial)).toBe(chaveConflito(potencial));
  });

  it('devolve a chave para um conflito FRACO', () => {
    const fraco = conflito(
      SeveridadeConflito.FRACO,
      TipoConflito.RESTRICAO_VIOLADA,
    );
    expect(chaveDoAceite(fraco)).toBe(chaveConflito(fraco));
  });
});
