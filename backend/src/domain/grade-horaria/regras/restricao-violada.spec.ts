import { SeveridadeConflito, TipoConflito } from '../conflito';
import { chaveProfessorSlot } from '../snapshot';
import {
  alocacao,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from '../fixtures';
import { RegraRestricaoViolada } from './restricao-violada';

describe('RegraRestricaoViolada', () => {
  const regra = new RegraRestricaoViolada();

  it('não gera conflito quando o professor não tem restrição no slot', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('gera conflito FORTE quando a restrição é amparada legalmente', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1', nome: 'Ana' })],
      slots: [slot({ id: 's1', codigo: 'SAB-M1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].tipo).toBe(TipoConflito.RESTRICAO_VIOLADA);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].alocacoesEnvolvidas).toEqual(['a1']);
    expect(conflitos[0].participantes).toEqual([
      { ofertaId: 'o1', slotId: 's1' },
    ]);
    expect(conflitos[0].contexto).toEqual(['p1', 's1']);
    expect(conflitos[0].mensagem).toContain('Ana');
    expect(conflitos[0].mensagem).toContain('SAB-M1');
  });

  it('gera conflito POTENCIAL quando a restrição é só preferência pessoal (sem amparo legal)', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1', nome: 'Ana' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
      restricoes: [[chaveProfessorSlot('p1', 's1'), false]],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.POTENCIAL);
    expect(conflitos[0].mensagem).toContain('Ana');
  });

  it('não gera conflito quando a coleta do período ainda não foi importada', () => {
    const snapshot = montarSnapshot({
      coletaImportada: false,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('dedup por oferta: aula geminada no mesmo slot restrito conta como um único conflito', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' })],
      ofertas: [oferta({ id: 'o1', turmaId: 't1', professorIds: ['p1'] })],
      alocacoes: [
        alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' }),
        alocacao({ id: 'a2', ofertaId: 'o1', slotId: 's1' }),
      ],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].alocacoesEnvolvidas.sort()).toEqual(['a1', 'a2']);
    expect(conflitos[0].participantes).toEqual([
      { ofertaId: 'o1', slotId: 's1' },
    ]);
  });

  it('detecta violação em codocência: qualquer professor restrito acende, mesmo que o outro não esteja', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      turmas: [turma({ id: 't1' })],
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      slots: [slot({ id: 's1' })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          professores: [
            { professorId: 'p1', proporcaoCarga: 70 },
            { professorId: 'p2', proporcaoCarga: 30 },
          ],
        }),
      ],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    const conflitos = regra.avaliar(snapshot);

    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].severidade).toBe(SeveridadeConflito.FORTE);
    expect(conflitos[0].contexto).toEqual(['p1', 's1']);
  });

  it('não acusa restrição de um professor que não está alocado em nenhuma aula', () => {
    const snapshot = montarSnapshot({
      coletaImportada: true,
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1' })],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    expect(regra.avaliar(snapshot)).toEqual([]);
  });

  it('lida com grade vazia', () => {
    expect(regra.avaliar(montarSnapshot({}))).toEqual([]);
    expect(regra.avaliar(montarSnapshot({ coletaImportada: true }))).toEqual(
      [],
    );
  });
});
