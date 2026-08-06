import { randomUUID } from 'crypto';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  ObjectLiteral,
  ObjectType,
} from 'typeorm';

import { PeriodoLetivoEntity } from '../entities/comum/periodo-letivo.entity';
import { UsuarioEntity } from '../entities/comum/usuario.entity';
import { PapelUsuario } from '../entities/comum/enums';
import { CursoEntity } from '../entities/academico/curso.entity';
import { DisciplinaEntity } from '../entities/academico/disciplina.entity';
import { CursoDisciplinaEntity } from '../entities/academico/curso-disciplina.entity';
import { ProfessorEntity } from '../entities/academico/professor.entity';
import { SalaEntity } from '../entities/academico/sala.entity';
import { SlotHorarioEntity } from '../entities/academico/slot-horario.entity';
import { TurmaEntity } from '../entities/academico/turma.entity';
import { OfertaDisciplinaEntity } from '../entities/academico/oferta-disciplina.entity';
import { ProfessorOfertaEntity } from '../entities/academico/professor-oferta.entity';
import { AlocacaoAulaEntity } from '../entities/grade-horaria/alocacao-aula.entity';
import {
  GrupoRegime,
  Modalidade,
  RegimeOferta,
  TipoSala,
  Turno,
} from '../entities/academico/enums';

/**
 * Seed da grade de exemplo: "Sistemas para Internet — 2º Período" no período
 * letivo 2026.2 (grade publicada em ifac.si/horarios).
 *
 * Idempotente: cada entidade de referência é criada por chave natural
 * (get-or-create), e as alocações do período são reescritas do zero a cada
 * execução — assim rodar a seed de novo não duplica aulas.
 */

// Uma linha da grade: uma disciplina ocupando um bloco contíguo de ordens num
// dia. Ordens com mais de um valor viram aulas geminadas (mesmo grupoBloco).
interface BlocoGrade {
  disciplina: string; // codigo da disciplina
  professor: string; // siape do professor
  sala: string; // nome da sala
  dia: number; // 1=Segunda ... 5=Sexta
  ordens: number[]; // ordem(ns) do slot no turno
}

// Turno da TARDE — 5 ordens de aula (o intervalo 16:00–16:20 não é slot).
const ORDENS_TARDE: { ordem: number; inicio: string; fim: string }[] = [
  { ordem: 1, inicio: '13:30', fim: '14:20' },
  { ordem: 2, inicio: '14:20', fim: '15:10' },
  { ordem: 3, inicio: '15:10', fim: '16:00' },
  { ordem: 4, inicio: '16:20', fim: '17:10' },
  { ordem: 5, inicio: '17:10', fim: '18:00' },
];

const DIAS = [
  { num: 1, sigla: 'SEG' },
  { num: 2, sigla: 'TER' },
  { num: 3, sigla: 'QUA' },
  { num: 4, sigla: 'QUI' },
  { num: 5, sigla: 'SEX' },
];

const DISCIPLINAS: {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  professorSiape: string;
}[] = [
  {
    codigo: 'ED',
    nome: 'Estrutura de Dados',
    cargaHoraria: 80,
    professorSiape: '10000001',
  },
  {
    codigo: 'SO',
    nome: 'Sistemas Operacionais',
    cargaHoraria: 80,
    professorSiape: '10000002',
  },
  {
    codigo: 'CPW1',
    nome: 'Construção de Páginas Web I',
    cargaHoraria: 66,
    professorSiape: '10000002',
  },
  {
    codigo: 'BD1',
    nome: 'Banco de Dados I',
    cargaHoraria: 66,
    professorSiape: '10000004',
  },
  {
    codigo: 'LP',
    nome: 'Linguagens de Programação',
    cargaHoraria: 66,
    professorSiape: '10000003',
  },
  {
    codigo: 'ES1',
    nome: 'Engenharia de Software I',
    cargaHoraria: 40,
    professorSiape: '10000005',
  },
];

// grupoRegime é obrigatório no cadastro; valores de exemplo (professores efetivos
// de dedicação exclusiva = G1). Não representam o regime real de ninguém.
const PROFESSORES: { siape: string; nome: string; grupoRegime: GrupoRegime }[] =
  [
    { siape: '10000001', nome: 'Jonas Pontes', grupoRegime: GrupoRegime.G1 },
    { siape: '10000002', nome: 'Darueck Campos', grupoRegime: GrupoRegime.G1 },
    { siape: '10000003', nome: 'Alvaro Rios', grupoRegime: GrupoRegime.G1 },
    { siape: '10000004', nome: 'Mauricio Cunha', grupoRegime: GrupoRegime.G1 },
    { siape: '10000005', nome: 'Flavio Farias', grupoRegime: GrupoRegime.G1 },
  ];

const SALAS = ['LAB 1', 'LAB 2', 'LAB 5'];

// A grade da imagem, célula por célula.
const GRADE: BlocoGrade[] = [
  // Segunda
  {
    disciplina: 'ED',
    professor: '10000001',
    sala: 'LAB 1',
    dia: 1,
    ordens: [1, 2, 3],
  },
  {
    disciplina: 'SO',
    professor: '10000002',
    sala: 'LAB 1',
    dia: 1,
    ordens: [4, 5],
  },
  // Terça
  {
    disciplina: 'CPW1',
    professor: '10000002',
    sala: 'LAB 1',
    dia: 2,
    ordens: [1, 2],
  },
  {
    disciplina: 'BD1',
    professor: '10000004',
    sala: 'LAB 2',
    dia: 2,
    ordens: [3, 4],
  },
  // Quarta
  {
    disciplina: 'SO',
    professor: '10000002',
    sala: 'LAB 1',
    dia: 3,
    ordens: [1, 2],
  },
  {
    disciplina: 'ED',
    professor: '10000001',
    sala: 'LAB 1',
    dia: 3,
    ordens: [3, 4],
  },
  // Quinta
  {
    disciplina: 'LP',
    professor: '10000003',
    sala: 'LAB 2',
    dia: 4,
    ordens: [1, 2, 3],
  },
  {
    disciplina: 'CPW1',
    professor: '10000002',
    sala: 'LAB 1',
    dia: 4,
    ordens: [4],
  },
  // Sexta
  {
    disciplina: 'BD1',
    professor: '10000004',
    sala: 'LAB 2',
    dia: 5,
    ordens: [1, 2],
  },
  {
    disciplina: 'ES1',
    professor: '10000005',
    sala: 'LAB 1',
    dia: 5,
    ordens: [3],
  },
  {
    disciplina: 'ES1',
    professor: '10000005',
    sala: 'LAB 5',
    dia: 5,
    ordens: [4],
  },
];

async function getOrCreate<T extends ObjectLiteral>(
  manager: EntityManager,
  target: ObjectType<T>,
  where: Partial<T>,
  data: DeepPartial<T>,
): Promise<T> {
  const repo = manager.getRepository(target);
  const existing = await repo.findOne({ where: where });
  if (existing) return existing;
  return repo.save(repo.create(data));
}

export async function seedGradeSI2026(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    // 1. Usuário responsável pelas alocações (criadoPor).
    const admin = await getOrCreate(
      manager,
      UsuarioEntity,
      { email: 'admin@ifac.edu.br' },
      {
        nome: 'Administrador',
        email: 'admin@ifac.edu.br',
        senha: 'seed-troque-esta-senha',
        papel: PapelUsuario.ADMIN,
        ativo: true,
      },
    );

    // 2. Período letivo 2026.2 (ativo).
    const periodo = await getOrCreate(
      manager,
      PeriodoLetivoEntity,
      { codigo: '2026.2' },
      {
        codigo: '2026.2',
        ano: 2026,
        semestre: 2,
        descricao: 'Segundo semestre de 2026',
        dataInicio: '2026-08-01',
        dataFim: '2026-12-15',
        ativo: true,
      },
    );

    // 3. Curso.
    const curso = await getOrCreate(
      manager,
      CursoEntity,
      { sigla: 'SI' },
      {
        nome: 'Sistemas para Internet',
        sigla: 'SI',
        modalidade: Modalidade.SUPERIOR,
        turnoPadrao: Turno.TARDE,
        ativo: true,
      },
    );

    // 4. Professores.
    const professoresPorSiape = new Map<string, ProfessorEntity>();
    for (const p of PROFESSORES) {
      const prof = await getOrCreate(
        manager,
        ProfessorEntity,
        { siape: p.siape },
        {
          nome: p.nome,
          siape: p.siape,
          grupoRegime: p.grupoRegime,
          ativo: true,
        },
      );
      professoresPorSiape.set(p.siape, prof);
    }

    // 5. Disciplinas (+ vínculo curso_disciplina no 2º período).
    const disciplinasPorCodigo = new Map<string, DisciplinaEntity>();
    for (const d of DISCIPLINAS) {
      const disc = await getOrCreate(
        manager,
        DisciplinaEntity,
        { codigo: d.codigo },
        {
          codigo: d.codigo,
          nome: d.nome,
          cargaHoraria: d.cargaHoraria,
          tipoSalaRequerido: TipoSala.LABORATORIO,
        },
      );
      disciplinasPorCodigo.set(d.codigo, disc);

      await getOrCreate(
        manager,
        CursoDisciplinaEntity,
        {
          curso: { id: curso.id },
          disciplina: { id: disc.id },
          periodo: 2,
        } as never,
        { curso, disciplina: disc, periodo: 2 },
      );
    }

    // 6. Salas (laboratórios).
    const salasPorNome = new Map<string, SalaEntity>();
    for (const nome of SALAS) {
      const sala = await getOrCreate(
        manager,
        SalaEntity,
        { nome },
        { nome, tipo: TipoSala.LABORATORIO, capacidade: 30, ativa: true },
      );
      salasPorNome.set(nome, sala);
    }

    // 7. Slots de horário (TARDE, Segunda a Sexta).
    const slotsPorChave = new Map<string, SlotHorarioEntity>(); // "dia-ordem"
    for (const dia of DIAS) {
      for (const t of ORDENS_TARDE) {
        const codigo = `${dia.sigla}-T${t.ordem}`;
        const slot = await getOrCreate(
          manager,
          SlotHorarioEntity,
          { codigo },
          {
            codigo,
            diaSemana: dia.num,
            turno: Turno.TARDE,
            ordem: t.ordem,
            horaInicio: t.inicio,
            horaFim: t.fim,
          },
        );
        slotsPorChave.set(`${dia.num}-${t.ordem}`, slot);
      }
    }

    // 8. Turma — 2º período em 2026.2 => ingresso em 2026.1.
    const turma = await getOrCreate(
      manager,
      TurmaEntity,
      { nome: 'SI 2026.1 — Tarde', curso: { id: curso.id } } as never,
      {
        curso,
        nome: 'SI 2026.1 — Tarde',
        semestreEntrada: '2026.1',
        quantidadeAlunos: 30,
        ativa: true,
      },
    );

    // 9. Ofertas de disciplina (turma + disciplina + período) e vínculo com
    // o professor. aulasSemana é derivada da contagem de slots na grade.
    const aulasPorDisciplina = new Map<string, number>();
    for (const bloco of GRADE) {
      aulasPorDisciplina.set(
        bloco.disciplina,
        (aulasPorDisciplina.get(bloco.disciplina) ?? 0) + bloco.ordens.length,
      );
    }

    const ofertasPorDisciplina = new Map<string, OfertaDisciplinaEntity>();
    for (const d of DISCIPLINAS) {
      const disc = disciplinasPorCodigo.get(d.codigo)!;
      const oferta = await getOrCreate(
        manager,
        OfertaDisciplinaEntity,
        {
          turma: { id: turma.id },
          disciplina: { id: disc.id },
          periodoLetivo: { id: periodo.id },
        } as never,
        {
          turma,
          disciplina: disc,
          periodoLetivo: periodo,
          regime: RegimeOferta.SEMESTRAL,
          aulasSemana: aulasPorDisciplina.get(d.codigo) ?? 0,
        },
      );
      ofertasPorDisciplina.set(d.codigo, oferta);

      const professor = professoresPorSiape.get(d.professorSiape)!;
      await getOrCreate(
        manager,
        ProfessorOfertaEntity,
        { professor: { id: professor.id }, oferta: { id: oferta.id } } as never,
        { professor, oferta, proporcaoCarga: 100 },
      );
    }

    // 10. Alocações de aula — reescreve do zero as do período para não
    // duplicar (a tabela não tem chave natural).
    const alocacaoRepo = manager.getRepository(AlocacaoAulaEntity);
    await alocacaoRepo.delete({ periodoLetivo: { id: periodo.id } });

    for (const bloco of GRADE) {
      const oferta = ofertasPorDisciplina.get(bloco.disciplina)!;
      const sala = salasPorNome.get(bloco.sala)!;
      // Bloco com mais de uma ordem => aula geminada (mesmo grupoBloco).
      const grupoBloco = bloco.ordens.length > 1 ? randomUUID() : null;

      for (const ordem of bloco.ordens) {
        const slot = slotsPorChave.get(`${bloco.dia}-${ordem}`)!;
        await alocacaoRepo.save(
          alocacaoRepo.create({
            oferta,
            slotHorario: slot,
            sala,
            periodoLetivo: periodo,
            grupoBloco,
            criadoPor: admin,
          }),
        );
      }
    }

    const totalAlocacoes = GRADE.reduce((n, b) => n + b.ordens.length, 0);
    console.log(
      `Seed concluída: ${DISCIPLINAS.length} disciplinas, ${PROFESSORES.length} professores, ` +
        `${SALAS.length} salas, ${slotsPorChave.size} slots e ${totalAlocacoes} alocações ` +
        `no período ${periodo.codigo}.`,
    );
  });
}
