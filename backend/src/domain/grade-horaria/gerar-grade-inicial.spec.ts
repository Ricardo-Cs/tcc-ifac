import { Modalidade, Turno } from '../academico/enums';
import { chaveProfessorSlot } from './snapshot';
import {
  alocacao,
  curso,
  montarSnapshot,
  oferta,
  professor,
  slot,
  turma,
} from './fixtures';
import {
  GeradorGradeInicialGuloso,
  gerarGradeInicial,
} from './gerar-grade-inicial';

describe('gerarGradeInicial', () => {
  it('aloca uma oferta sem alocação no primeiro slot livre do turno do curso', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [
        slot({ id: 'seg-m1', diaSemana: 1, turno: Turno.MANHA, ordem: 1 }),
        slot({ id: 'seg-t1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toEqual([{ ofertaId: 'o1', slotHorarioId: 'seg-t1' }]);
  });

  it('evita slot onde o professor da oferta já está ocupado', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [
        turma({ id: 't1', cursoId: 'c1' }),
        turma({ id: 't2', cursoId: 'c1' }),
      ],
      professores: [professor({ id: 'p1' })],
      slots: [
        slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
        slot({ id: 's2', diaSemana: 1, turno: Turno.TARDE, ordem: 2 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
        oferta({
          id: 'o2',
          turmaId: 't2',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toEqual([{ ofertaId: 'o2', slotHorarioId: 's2' }]);
  });

  it('evita slot onde a turma da oferta já está ocupada', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' }), professor({ id: 'p2' })],
      slots: [
        slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
        slot({ id: 's2', diaSemana: 1, turno: Turno.TARDE, ordem: 2 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
        oferta({
          id: 'o2',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p2'],
        }),
      ],
      alocacoes: [alocacao({ id: 'a1', ofertaId: 'o1', slotId: 's1' })],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toEqual([{ ofertaId: 'o2', slotHorarioId: 's2' }]);
  });

  it('evita slot com restrição do professor, legal ou pessoal', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [
        slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
        slot({ id: 's2', diaSemana: 1, turno: Turno.TARDE, ordem: 2 }),
        slot({ id: 's3', diaSemana: 1, turno: Turno.TARDE, ordem: 3 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
      restricoes: [
        [chaveProfessorSlot('p1', 's1'), true],
        [chaveProfessorSlot('p1', 's2'), false],
      ],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toEqual([{ ofertaId: 'o1', slotHorarioId: 's3' }]);
  });

  it('preenche todas as aulas restantes em slots distintos', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [
        slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
        slot({ id: 's2', diaSemana: 1, turno: Turno.TARDE, ordem: 2 }),
        slot({ id: 's3', diaSemana: 2, turno: Turno.TARDE, ordem: 1 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 3,
          professorIds: ['p1'],
        }),
      ],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toHaveLength(3);
    expect(new Set(propostas.map((p) => p.slotHorarioId)).size).toBe(3);
  });

  it('curso INTEGRADO prefere slots de manhã E tarde', () => {
    const snapshot = montarSnapshot({
      cursos: [
        curso({
          id: 'c1',
          modalidade: Modalidade.INTEGRADO,
          turnoPadrao: Turno.MANHA,
        }),
      ],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [
        slot({ id: 'noite', diaSemana: 1, turno: Turno.NOITE, ordem: 1 }),
        slot({ id: 'tarde', diaSemana: 1, turno: Turno.TARDE, ordem: 1 }),
      ],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
    });

    const propostas = gerarGradeInicial(snapshot);

    expect(propostas).toEqual([{ ofertaId: 'o1', slotHorarioId: 'tarde' }]);
  });

  it('não propõe nada quando não há slot livre para a oferta', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
      restricoes: [[chaveProfessorSlot('p1', 's1'), true]],
    });

    expect(gerarGradeInicial(snapshot)).toEqual([]);
  });

  it('lida com grade vazia', () => {
    expect(gerarGradeInicial(montarSnapshot({}))).toEqual([]);
  });
});

describe('GeradorGradeInicialGuloso', () => {
  it('delega para gerarGradeInicial', () => {
    const snapshot = montarSnapshot({
      cursos: [curso({ id: 'c1', turnoPadrao: Turno.TARDE })],
      turmas: [turma({ id: 't1', cursoId: 'c1' })],
      professores: [professor({ id: 'p1' })],
      slots: [slot({ id: 's1', diaSemana: 1, turno: Turno.TARDE, ordem: 1 })],
      ofertas: [
        oferta({
          id: 'o1',
          turmaId: 't1',
          aulasSemana: 1,
          professorIds: ['p1'],
        }),
      ],
    });

    expect(new GeradorGradeInicialGuloso().gerar(snapshot)).toEqual(
      gerarGradeInicial(snapshot),
    );
  });
});
