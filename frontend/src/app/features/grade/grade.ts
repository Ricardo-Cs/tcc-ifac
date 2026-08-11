/**
 * A grade de horários — a tela central do Chronos. Fecha o laço de demonstração
 * do TCC: carrega a grade real, exibe, deixa a comissão MOVER uma aula (arrastar
 * e soltar), o conflito ACENDE na hora (o servidor devolve a grade recalculada)
 * e a comissão pode ACEITAR o conflito que decide conviver.
 *
 * Princípio herdado do backend: o sistema não bloqueia — mover para cima de
 * outra aula é permitido; o que aparece é o conflito, não um erro.
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { GradeApi } from '../../core/api/grade-api';
import {
  Aula,
  Conflito,
  Curso,
  Grade,
  Periodo,
  Severidade,
  Slot,
  Turma,
} from '../../core/models/grade.models';

interface Linha {
  turno: string;
  ordem: number;
  /** Nome legível do turno ("Tarde"). */
  turnoRotulo: string;
  /** Faixa horária já formatada ("13:30 – 14:20"). */
  faixa: string;
}

/** "13:30:00" → "13:30". */
function hhmm(hora: string): string {
  return hora?.slice(0, 5) ?? '';
}

const DIAS = [
  { num: 1, nome: 'Segunda' },
  { num: 2, nome: 'Terça' },
  { num: 3, nome: 'Quarta' },
  { num: 4, nome: 'Quinta' },
  { num: 5, nome: 'Sexta' },
];

const TURNO_RANK: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };
const TURNO_ROTULO: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

/** FORTE primeiro — é o que a comissão precisa resolver antes de publicar. */
const SEVERIDADE_RANK: Record<Severidade, number> = {
  FORTE: 0,
  POTENCIAL: 1,
  FRACO: 2,
};

const SEVERIDADE_ROTULO: Record<Severidade, string> = {
  FORTE: 'Forte',
  POTENCIAL: 'Potencial',
  FRACO: 'Fraco',
};

/**
 * O `tipo` do conflito é taxonomia do domínio (`TipoConflito` no backend) — cru
 * na tela vira jargão de banco de dados. A comissão lê o que aconteceu, não o
 * identificador. Um tipo novo que ainda não esteja aqui cai no `humanizar`, que
 * ao menos tira o CAIXA_ALTA_COM_UNDERLINE.
 */
const TIPO_ROTULO: Record<string, string> = {
  PROFESSOR_DUPLICADO: 'Professor em duas aulas',
  TURMA_DUPLICADA: 'Turma em duas aulas',
  SALA_OCUPADA: 'Sala ocupada',
  RESTRICAO_VIOLADA: 'Restrição do professor',
  CARGA_SEMANAL_EXCEDIDA: 'Carga semanal excedida',
  RESTRICAO_NAO_IMPORTADA: 'Coleta não importada',
  CARGA_OFERTA_INCOMPLETA: 'Carga da oferta incompleta',
  CAPACIDADE_SALA_INSUFICIENTE: 'Sala pequena para a turma',
  TIPO_SALA_INADEQUADO: 'Tipo de sala inadequado',
  HORARIO_NAO_PREFERIDO: 'Horário não preferido',
};

/** "ALGO_NOVO_ASSIM" → "Algo novo assim". */
function humanizar(tipo: string): string {
  const texto = tipo.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Cores por severidade. FORTE reaproveita o token `destructive` do tema; âmbar e
 * azul não têm token, então vêm da paleta do Tailwind. Centralizado aqui para o
 * template ficar declarativo.
 */
const SEVERIDADE_PILL: Record<Severidade, string> = {
  FORTE: 'bg-destructive/10 text-destructive',
  POTENCIAL: 'bg-amber-100 text-amber-700',
  FRACO: 'bg-blue-100 text-blue-700',
};
const SEVERIDADE_CARTAO: Record<Severidade, string> = {
  FORTE: 'bg-destructive/5',
  POTENCIAL: 'bg-amber-50',
  FRACO: 'bg-blue-50',
};

/**
 * Visão "todos os cursos" — a grade inteira do campus numa tabela só. Não é o
 * padrão (a comissão monta um curso de cada vez), mas é onde se enxerga o que
 * atravessa cursos: o professor que dá aula em dois deles.
 */
const TODOS_OS_CURSOS = '__todos__';

/**
 * Visão "todas as turmas do curso" — as três grades de SI (1º, 3º, 6º) na mesma
 * tabela. Não é o padrão: a comissão monta uma turma por vez, e é justamente o
 * empilhamento das turmas numa célula só que essa separação desfaz. Serve para
 * enxergar o que atravessa turmas do mesmo curso (o professor que dá aula em
 * duas delas, a sala disputada).
 */
const TODAS_AS_TURMAS = '__todas__';

@Component({
  selector: 'app-grade',
  imports: [FormsModule, HlmButton, HlmInput, ...HlmCardImports, ...HlmSelectImports],
  templateUrl: './grade.html',
})
export class GradeComponent implements OnInit {
  private readonly api = inject(GradeApi);

  readonly dias = DIAS;
  readonly TODOS = TODOS_OS_CURSOS;
  readonly TODAS = TODAS_AS_TURMAS;

  readonly grade = signal<Grade | null>(null);
  readonly periodos = signal<Periodo[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  /**
   * O curso em exibição. `null` só no instante anterior à primeira carga —
   * `aplicarGrade` resolve para o primeiro curso do período. Nunca começa em
   * "todos": a comissão monta um curso de cada vez, e empilhar as três
   * modalidades numa tabela só é justamente o que essa separação desfaz.
   */
  readonly cursoSelecionado = signal<string | null>(null);

  /**
   * A turma em exibição dentro do curso. É o recorte que importa: um curso tem
   * várias turmas correndo ao mesmo tempo (SI tem 1º, 3º e 6º períodos), cada
   * uma com sua grade. `aplicarGrade` resolve para a primeira turma do curso.
   */
  readonly turmaSelecionada = signal<string | null>(null);

  /** Aula sendo arrastada; a célula sob o cursor destaca-se como alvo. */
  readonly arrastando = signal<Aula | null>(null);
  readonly celulaAlvo = signal<string | null>(null);

  /** Conflito em foco no painel — realça as aulas envolvidas na grade. */
  readonly conflitoEmFoco = signal<Conflito | null>(null);
  /** Conflito cujo formulário de aceite está aberto. */
  readonly aceitando = signal<Conflito | null>(null);
  justificativa = '';

  ngOnInit(): void {
    this.carregar(() => this.api.gradeAtual());
    this.api.periodos().subscribe({
      next: (p) => this.periodos.set(p),
      error: () => {},
    });
  }

  // ---- Cursos: a grade separada por curso --------------------------------

  readonly cursos = computed<Curso[]>(() => this.grade()?.cursos ?? []);

  /** O curso em exibição, ou `null` quando a visão é "todos os cursos". */
  readonly cursoAtual = computed<Curso | null>(() => {
    const id = this.cursoSelecionado();
    return this.cursos().find((c) => c.id === id) ?? null;
  });

  readonly vendoTodos = computed(() => this.cursoSelecionado() === this.TODOS);

  // ---- Turmas: a grade que de fato existe --------------------------------

  /** As turmas do curso em exibição — na visão "todos os cursos", todas elas. */
  readonly turmasDoCurso = computed<Turma[]>(() => {
    const turmas = this.grade()?.turmas ?? [];
    const curso = this.cursoSelecionado();
    if (!curso || curso === this.TODOS) return turmas;
    return turmas.filter((t) => t.cursoId === curso);
  });

  readonly turmaAtual = computed<Turma | null>(() => {
    const id = this.turmaSelecionada();
    return this.turmasDoCurso().find((t) => t.id === id) ?? null;
  });

  /** Verdadeiro quando a tabela empilha mais de uma turma — curso inteiro ou campus. */
  readonly vendoVariasTurmas = computed(
    () => this.turmaSelecionada() === this.TODAS || this.vendoTodos(),
  );

  /** As aulas em exibição — a base de tudo que a tabela desenha. */
  private readonly aulasVisiveis = computed<Aula[]>(() => {
    const todas = this.grade()?.aulas ?? [];
    const curso = this.cursoSelecionado();
    const turma = this.turmaSelecionada();
    if (turma && turma !== this.TODAS) return todas.filter((a) => a.turmaId === turma);
    if (!curso || curso === this.TODOS) return todas;
    return todas.filter((a) => a.cursoId === curso);
  });

  /** Todas as aulas por id (inclusive as ocultas) — resolve os envolvidos num conflito. */
  private readonly aulaPorId = computed<Map<string, Aula>>(
    () => new Map((this.grade()?.aulas ?? []).map((a) => [a.id, a])),
  );

  private readonly siglaPorCurso = computed<Map<string, string>>(
    () => new Map(this.cursos().map((c) => [c.id, c.sigla])),
  );

  /** Sigla do curso da aula — só interessa na visão "todos", onde eles se misturam. */
  siglaDaAula(aula: Aula): string | null {
    return aula.cursoId ? this.siglaPorCurso().get(aula.cursoId) ?? null : null;
  }

  /**
   * Trocar de curso troca também de turma: a turma anterior é de outro curso e
   * deixaria a tabela vazia. Cai na primeira turma do curso novo — a grade de
   * uma turma é o que a comissão veio montar.
   */
  selecionarCurso(id: string): void {
    this.cursoSelecionado.set(id);
    this.turmaSelecionada.set(this.primeiraTurmaDoCurso(id));
    this.conflitoEmFoco.set(null);
    this.cancelarAceite();
  }

  selecionarTurma(id: string): void {
    this.turmaSelecionada.set(id);
    this.conflitoEmFoco.set(null);
    this.cancelarAceite();
  }

  /**
   * Rótulo do gatilho do select de turmas. Sem isto, o `BrnSelectValue` mostra
   * o UUID cru em vez do nome da turma.
   */
  rotuloTurma = (id: string): string => {
    if (id === TODAS_AS_TURMAS) return 'Todas as turmas';
    return this.turmasDoCurso().find((t) => t.id === id)?.nome ?? '';
  };

  /**
   * A turma que abre o curso, ou "todas" quando ele não tem nenhuma — a visão
   * ainda mostra o curso inteiro em vez de uma tabela em branco.
   */
  private primeiraTurmaDoCurso(cursoId: string): string {
    const turmas = this.grade()?.turmas ?? [];
    if (cursoId === this.TODOS) return TODAS_AS_TURMAS;
    return turmas.find((t) => t.cursoId === cursoId)?.id ?? TODAS_AS_TURMAS;
  }

  // ---- Estrutura da grade (linhas × dias) -------------------------------

  /**
   * Os turnos que a grade do curso em exibição desenha: o turno padrão dele mais
   * qualquer turno onde ele já tenha aula (contra-turno acontece). `null` = sem
   * recorte, a visão "todos" mostra o dia inteiro.
   */
  private readonly turnosVisiveis = computed<Set<string> | null>(() => {
    const curso = this.cursoAtual();
    if (!curso) return null;
    const turnos = new Set<string>([curso.turnoPadrao]);
    for (const a of this.aulasVisiveis()) {
      if (a.slot) turnos.add(a.slot.turno);
    }
    return turnos;
  });

  /** Uma linha por (turno, ordem) dos slots do turno em exibição, ordenadas. */
  readonly linhas = computed<Linha[]>(() => {
    const slots = this.grade()?.slots ?? [];
    const turnos = this.turnosVisiveis();
    const vistas = new Map<string, Linha>();
    for (const s of slots) {
      if (turnos && !turnos.has(s.turno)) continue;
      const chave = `${s.turno}-${s.ordem}`;
      if (!vistas.has(chave)) {
        vistas.set(chave, {
          turno: s.turno,
          ordem: s.ordem,
          turnoRotulo: TURNO_ROTULO[s.turno] ?? s.turno,
          faixa: `${hhmm(s.horaInicio)} – ${hhmm(s.horaFim)}`,
        });
      }
    }
    return [...vistas.values()].sort(
      (a, b) =>
        (TURNO_RANK[a.turno] ?? 9) - (TURNO_RANK[b.turno] ?? 9) ||
        a.ordem - b.ordem,
    );
  });

  private readonly slotPorCelula = computed(() => {
    const mapa = new Map<string, Slot>();
    for (const s of this.grade()?.slots ?? []) {
      mapa.set(`${s.diaSemana}-${s.turno}-${s.ordem}`, s);
    }
    return mapa;
  });

  private readonly aulasPorSlot = computed(() => {
    const mapa = new Map<string, Aula[]>();
    for (const a of this.aulasVisiveis()) {
      if (!a.slot) continue;
      const lista = mapa.get(a.slot.id) ?? [];
      lista.push(a);
      mapa.set(a.slot.id, lista);
    }
    return mapa;
  });

  /** Pior severidade que toca cada aula — governa a cor do cartão. */
  private readonly severidadePorAula = computed(() => {
    const mapa = new Map<string, Severidade>();
    for (const c of this.grade()?.conflitos ?? []) {
      for (const id of c.alocacoesEnvolvidas) {
        const atual = mapa.get(id);
        if (atual === undefined || SEVERIDADE_RANK[c.severidade] < SEVERIDADE_RANK[atual]) {
          mapa.set(id, c.severidade);
        }
      }
    }
    return mapa;
  });

  slotDaCelula(dia: number, linha: Linha): Slot | undefined {
    return this.slotPorCelula().get(`${dia}-${linha.turno}-${linha.ordem}`);
  }

  aulasDoSlot(slot: Slot | undefined): Aula[] {
    return slot ? this.aulasPorSlot().get(slot.id) ?? [] : [];
  }

  severidadeDaAula(aula: Aula): Severidade | null {
    return this.severidadePorAula().get(aula.id) ?? null;
  }

  rotuloSeveridade(sev: Severidade): string {
    return SEVERIDADE_ROTULO[sev];
  }

  rotuloTipo(tipo: string): string {
    return TIPO_ROTULO[tipo] ?? humanizar(tipo);
  }

  /** Classe do "pill" de severidade (fundo + texto). */
  pillSeveridade(sev: Severidade): string {
    return SEVERIDADE_PILL[sev];
  }

  /** Classe da borda esquerda + fundo do cartão da conflito/aula, por severidade. */
  cartaoSeveridade(sev: Severidade | null): string {
    return sev ? SEVERIDADE_CARTAO[sev] : 'bg-card';
  }

  /**
   * Rótulo exibido no gatilho do select. Sem isto, o `BrnSelectValue` mostra o
   * valor cru (o UUID do período) em vez do código legível.
   */
  rotuloPeriodo = (id: string): string => {
    return this.periodos().find((p) => p.id === id)?.codigo ?? '';
  };

  /**
   * Idem para o curso: "SI — Sistemas para Internet". A sigla sozinha só diz
   * algo a quem já a conhece; o nome inteiro sozinho não cabe. Os dois juntos
   * servem à comissão e a quem vê o sistema pela primeira vez.
   */
  rotuloCurso = (id: string): string => {
    if (id === TODOS_OS_CURSOS) return 'Todos os cursos';
    const curso = this.cursos().find((c) => c.id === id);
    return curso ? `${curso.sigla} — ${curso.nome}` : '';
  };

  /** A aula está entre as envolvidas no conflito em foco? (realce no painel) */
  emFoco(aula: Aula): boolean {
    const c = this.conflitoEmFoco();
    return !!c && c.alocacoesEnvolvidas.includes(aula.id);
  }

  // ---- Conflitos ---------------------------------------------------------

  /**
   * Os conflitos que tocam o curso em exibição — inclusive os que ele divide com
   * outro curso (um professor em dois cursos no mesmo horário aparece na grade
   * dos DOIS). Filtrar por curso não pode esconder o conflito de quem o causou.
   */
  readonly conflitosOrdenados = computed(() => {
    const visiveis = new Set(this.aulasVisiveis().map((a) => a.id));
    return [...(this.grade()?.conflitos ?? [])]
      .filter((c) => c.alocacoesEnvolvidas.some((id) => visiveis.has(id)))
      .sort(
        (a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade],
      );
  });

  /**
   * As turmas envolvidas no conflito que NÃO estão na tabela em exibição — de
   * outro período do mesmo curso ou de outro curso. Sem isto, a comissão vê um
   * conflito acusando uma aula que não está na tela e não tem como saber de
   * onde ela veio: o professor de SI que também dá aula no 3º período é
   * exatamente o caso que mais aparece.
   */
  outrasTurmas(conflito: Conflito): string[] {
    const visiveis = new Set(this.aulasVisiveis().map((a) => a.id));
    const nomes = new Set<string>();
    for (const id of conflito.alocacoesEnvolvidas) {
      if (visiveis.has(id)) continue;
      const aula = this.aulaPorId().get(id);
      if (aula?.turma) nomes.add(aula.turma);
    }
    return [...nomes];
  }

  readonly totaisPorSeveridade = computed(() => {
    const t = { FORTE: 0, POTENCIAL: 0, FRACO: 0 };
    for (const c of this.conflitosOrdenados()) t[c.severidade]++;
    return t;
  });

  // ---- Ações -------------------------------------------------------------

  trocarPeriodo(id: string): void {
    if (!id) return;
    this.carregar(() => this.api.grade(id));
  }

  aoIniciarArraste(aula: Aula): void {
    this.arrastando.set(aula);
  }

  aoTerminarArraste(): void {
    this.arrastando.set(null);
    this.celulaAlvo.set(null);
  }

  aoSobrevoar(dia: number, linha: Linha, evento: DragEvent): void {
    if (!this.arrastando()) return;
    evento.preventDefault();
    this.celulaAlvo.set(`${dia}-${linha.turno}-${linha.ordem}`);
  }

  aoSoltar(dia: number, linha: Linha, evento: DragEvent): void {
    evento.preventDefault();
    const aula = this.arrastando();
    const slotDestino = this.slotDaCelula(dia, linha);
    this.aoTerminarArraste();
    if (!aula || !slotDestino) return;
    if (aula.slot?.id === slotDestino.id) return; // soltou no mesmo lugar
    this.executar(() => this.api.mover(aula.id, slotDestino.id));
  }

  remover(aula: Aula): void {
    this.executar(() => this.api.remover(aula.id));
  }

  abrirAceite(conflito: Conflito): void {
    this.aceitando.set(conflito);
    this.justificativa = '';
  }

  cancelarAceite(): void {
    this.aceitando.set(null);
    this.justificativa = '';
  }

  confirmarAceite(): void {
    const conflito = this.aceitando();
    const texto = this.justificativa.trim();
    if (!conflito || !texto) return;
    this.executar(() => this.api.aceitarConflito(conflito.chave, texto));
    this.cancelarAceite();
  }

  celulaEhAlvo(dia: number, linha: Linha): boolean {
    return this.celulaAlvo() === `${dia}-${linha.turno}-${linha.ordem}`;
  }

  // ---- Infra de carga ----------------------------------------------------

  private carregar(fonte: () => import('rxjs').Observable<Grade>): void {
    this.carregando.set(true);
    this.erro.set(null);
    fonte().subscribe({
      next: (g) => {
        this.aplicarGrade(g);
        this.carregando.set(false);
      },
      error: (e) => this.falhar(e),
    });
  }

  /** Escrita: troca o estado pela grade já recalculada que o servidor devolve. */
  private executar(acao: () => import('rxjs').Observable<Grade>): void {
    this.erro.set(null);
    acao().subscribe({
      next: (g) => this.aplicarGrade(g),
      error: (e) => this.falhar(e),
    });
  }

  /**
   * Guarda a grade e garante que a seleção de curso continue válida — trocar de
   * período pode trazer outro conjunto de cursos, e cair numa visão vazia (ou
   * num curso que não existe mais) pareceria grade em branco.
   */
  private aplicarGrade(g: Grade): void {
    this.grade.set(g);

    const curso = this.cursoSelecionado();
    const cursoExiste = curso === this.TODOS || g.cursos.some((c) => c.id === curso);
    const cursoResolvido = cursoExiste ? curso : (g.cursos[0]?.id ?? this.TODOS);
    if (!cursoExiste) this.cursoSelecionado.set(cursoResolvido);

    // A turma precisa continuar existindo E pertencer ao curso em exibição —
    // sobrou de outro curso, a tabela viria vazia sem nada explicando por quê.
    const turma = this.turmaSelecionada();
    const turmaValida =
      turma === this.TODAS ||
      g.turmas.some((t) => t.id === turma && t.cursoId === cursoResolvido);
    if (!turmaValida) {
      this.turmaSelecionada.set(this.primeiraTurmaDoCurso(cursoResolvido ?? this.TODOS));
    }
  }

  private falhar(e: unknown): void {
    this.carregando.set(false);
    const msg =
      (e as { error?: { message?: string } })?.error?.message ??
      'Não foi possível falar com o servidor. Confira se o backend está no ar (porta 3000).';
    this.erro.set(Array.isArray(msg) ? msg.join(' ') : msg);
  }
}
