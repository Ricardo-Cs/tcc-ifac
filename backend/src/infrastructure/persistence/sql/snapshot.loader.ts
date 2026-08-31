import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  GrupoRegime,
  Modalidade,
  TipoSala,
  Turno,
} from '../../../domain/academico/enums';
import {
  AlocacaoSnapshot,
  CursoSnapshot,
  DadosSnapshot,
  DisciplinaSnapshot,
  Id,
  OfertaSnapshot,
  ParticipacaoProfessor,
  ProfessorSnapshot,
  SalaSnapshot,
  SlotSnapshot,
  TurmaSnapshot,
  chaveProfessorSlot,
} from '../../../domain/grade-horaria/snapshot';
import { SnapshotLoader } from '@domain/grade-horaria/ports';

/**
 * Loader do snapshot em SQL cru (`persistence/sql/`). Carrega o período inteiro
 * em poucas queries chatas e devolve os DADOS BRUTOS — quem deriva os índices é
 * `construirSnapshot` no domínio, para que a coerência índice↔alocação viva num
 * lugar só. SQL em vez de repositório com relações: a carga do snapshot é um
 * read model plano; hidratar entidades com joins profundos custaria mais e não
 * traria nada.
 *
 * Os nomes de coluna são snake_case porque a `SnakeNamingStrategy` mapeia as
 * relações (`oferta` -> `oferta_id`, `slotHorario` -> `slot_horario_id`) e os
 * campos camelCase (`grupoBloco` -> `grupo_bloco`) assim. Se uma entidade for
 * renomeada, é aqui que o SQL precisa acompanhar.
 *
 * Escopo protótipo: carrega SÓ o período pedido. Trazer as ofertas ANUAIS do
 * semestre anterior do mesmo ano (item B6/20 do backlog) fica para depois.
 */
@Injectable()
export class SqlSnapshotLoader implements SnapshotLoader {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async carregar(periodoLetivoId: string): Promise<DadosSnapshot> {
    const [
      alocacoesRows,
      ofertasRows,
      profOfertaRows,
      professoresRows,
      turmasRows,
      cursosRows,
      disciplinasRows,
      salasRows,
      slotsRows,
      restricoesRows,
      coletaRows,
    ] = await Promise.all([
      this.dataSource.query(
        `SELECT id, oferta_id, slot_horario_id, sala_id, grupo_bloco, version
           FROM alocacao_aula
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT id, turma_id, disciplina_id, aulas_semana
           FROM oferta_disciplina
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT po.oferta_id, po.professor_id, po.proporcao_carga
           FROM professor_oferta po
           JOIN oferta_disciplina o ON o.id = po.oferta_id
          WHERE o.periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      // Tabelas de referência (professores, turmas, cursos, disciplinas, salas,
      // slots) são pequenas — carregar inteiras evita joins e é barato num campus.
      this.dataSource.query(
        `SELECT id, nome, grupo_regime, ajuste_carga_horas, ajuste_carga_motivo
           FROM professor`,
      ),
      this.dataSource.query(
        `SELECT id, nome, quantidade_alunos, curso_id FROM turma`,
      ),
      this.dataSource.query(
        `SELECT id, nome, sigla, modalidade, turno_padrao FROM curso`,
      ),
      this.dataSource.query(
        `SELECT id, codigo, nome, tipo_sala_requerido FROM disciplina`,
      ),
      this.dataSource.query(`SELECT id, nome, tipo, capacidade FROM sala`),
      this.dataSource.query(
        `SELECT id, codigo, dia_semana, turno, ordem, hora_inicio, hora_fim FROM slot_horario`,
      ),
      this.dataSource.query(
        `SELECT professor_id, slot_horario_id, amparo_legal
           FROM restricao_professor
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT 1 FROM coleta_restricao WHERE periodo_letivo_id = $1 LIMIT 1`,
        [periodoLetivoId],
      ),
    ]);

    // Participações agrupadas por oferta, para montar OfertaSnapshot.professores.
    const participacoesPorOferta = new Map<Id, ParticipacaoProfessor[]>();
    for (const row of profOfertaRows) {
      const lista = participacoesPorOferta.get(row.oferta_id) ?? [];
      lista.push({
        professorId: row.professor_id,
        // proporcao_carga é numeric => o driver devolve string.
        proporcaoCarga: parseFloat(row.proporcao_carga),
      });
      participacoesPorOferta.set(row.oferta_id, lista);
    }

    const alocacoes: AlocacaoSnapshot[] = alocacoesRows.map((row) => ({
      id: row.id,
      ofertaId: row.oferta_id,
      slotId: row.slot_horario_id,
      salaId: row.sala_id,
      grupoBloco: row.grupo_bloco,
      version: row.version,
    }));

    const ofertas = new Map<Id, OfertaSnapshot>(
      ofertasRows.map((row) => [
        row.id,
        {
          id: row.id,
          turmaId: row.turma_id,
          disciplinaId: row.disciplina_id,
          aulasSemana: row.aulas_semana,
          professores: participacoesPorOferta.get(row.id) ?? [],
        } satisfies OfertaSnapshot,
      ]),
    );

    const professores = new Map<Id, ProfessorSnapshot>(
      professoresRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          grupoRegime: row.grupo_regime as GrupoRegime,
          ajusteCargaHoras: row.ajuste_carga_horas,
          ajusteCargaMotivo: row.ajuste_carga_motivo,
        } satisfies ProfessorSnapshot,
      ]),
    );

    const turmas = new Map<Id, TurmaSnapshot>(
      turmasRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          quantidadeAlunos: row.quantidade_alunos,
          cursoId: row.curso_id,
        } satisfies TurmaSnapshot,
      ]),
    );

    const cursos = new Map<Id, CursoSnapshot>(
      cursosRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          sigla: row.sigla,
          modalidade: row.modalidade as Modalidade,
          turnoPadrao: row.turno_padrao as Turno,
        } satisfies CursoSnapshot,
      ]),
    );

    const disciplinas = new Map<Id, DisciplinaSnapshot>(
      disciplinasRows.map((row) => [
        row.id,
        {
          id: row.id,
          codigo: row.codigo,
          nome: row.nome,
          tipoSalaRequerido: row.tipo_sala_requerido as TipoSala | null,
        } satisfies DisciplinaSnapshot,
      ]),
    );

    const salas = new Map<Id, SalaSnapshot>(
      salasRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          tipo: row.tipo as TipoSala,
          capacidade: row.capacidade,
        } satisfies SalaSnapshot,
      ]),
    );

    const slots = new Map<Id, SlotSnapshot>(
      slotsRows.map((row) => [
        row.id,
        {
          id: row.id,
          codigo: row.codigo,
          diaSemana: row.dia_semana,
          turno: row.turno as Turno,
          ordem: row.ordem,
          horaInicio: row.hora_inicio,
          horaFim: row.hora_fim,
        } satisfies SlotSnapshot,
      ]),
    );

    const restricoes = new Map<string, boolean>(
      restricoesRows.map((row) => [
        chaveProfessorSlot(row.professor_id, row.slot_horario_id),
        row.amparo_legal,
      ]),
    );

    return {
      periodoLetivoId,
      alocacoes,
      ofertas,
      professores,
      turmas,
      cursos,
      disciplinas,
      salas,
      slots,
      restricoes,
      coletaImportada: coletaRows.length > 0,
    };
  }
}
