/**
 * A grade de horários — a tela central do Chronos. Fecha o laço de demonstração
 * do TCC: carrega a grade real, exibe, deixa a comissão MOVER uma aula (arrastar
 * e soltar), o conflito ACENDE na hora (o servidor devolve a grade recalculada)
 * e a comissão pode ACEITAR o conflito que decide conviver.
 *
 * Princípio herdado do backend: o sistema não bloqueia — mover para cima de
 * outra aula é permitido; o que aparece é o conflito, não um erro.
 *
 * Este componente é o cérebro: guarda o estado, fala com o servidor e monta as
 * formas prontas (view-models) da grade. Quem desenha são os filhos — a barra, a
 * tabela e o painel de conflitos —, que só recebem e anunciam.
 */
import { Component, computed, effect, inject, signal } from '@angular/core';
import { GradeApi } from '../../core/api/grade-api';
import { PeriodoState } from '../../core/state/periodo-state';
import {
  Aula,
  Conflito,
  Curso,
  Grade,
  OfertaAlocavel,
  Severidade,
  Slot,
  Turma,
} from '../../core/models/grade.models';
import { GradeToolbarComponent } from './components/grade-toolbar/grade-toolbar';
import { GradeTabelaComponent, EventoCelula } from './components/grade-tabela/grade-tabela';
import { ConflitosPainelComponent } from './components/conflitos-painel/conflitos-painel';
import { CatalogoOfertasComponent } from './components/catalogo-ofertas/catalogo-ofertas';
import { SEVERIDADE_RANK } from './severidade';
import {
  ConflitoVm,
  EscopoConflitos,
  LinhaVm,
  TODAS_AS_TURMAS,
  TODOS_OS_CURSOS,
  chaveCelula,
  mapaSeveridadePorAula,
  montarLinhas,
} from './grade.view';

@Component({
  selector: 'app-grade',
  imports: [
    GradeToolbarComponent,
    GradeTabelaComponent,
    ConflitosPainelComponent,
    CatalogoOfertasComponent,
  ],
  templateUrl: './grade.html',
})
export class GradeComponent {
  private readonly api = inject(GradeApi);

  /** Período em foco no sistema (seletor do header). A grade o segue. */
  readonly periodo = inject(PeriodoState);

  readonly TODOS = TODOS_OS_CURSOS;
  readonly TODAS = TODAS_AS_TURMAS;

  readonly grade = signal<Grade | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  /**
   * Catálogo de ofertas a alocar do período (todas as turmas). Vem de um
   * endpoint próprio porque a `Grade` só conhece as aulas JÁ postas — uma oferta
   * sem nenhuma aula, ou o total `aulasSemana`, não estão nela. O recorte por
   * turma é feito no `ofertasCatalogo`, como as aulas.
   */
  readonly catalogo = signal<OfertaAlocavel[]>([]);

  /** Id do período já carregado — evita recarregar quando o foco não mudou. */
  private periodoCarregado: string | null | undefined;

  constructor() {
    // A grade acompanha o período em foco: o header troca o `?periodo=` da URL,
    // `selecionado()` reflete, e aqui recarregamos. Enquanto a lista de períodos
    // não resolve, `selecionado()` é nulo e caímos no `gradeAtual()` — a grade
    // aparece sem esperar; quando o id do corrente chega, recarrega por ele.
    effect(() => {
      const foco = this.periodo.selecionado();
      const id = foco?.id ?? null;
      if (id === this.periodoCarregado) return;
      this.periodoCarregado = id;
      this.carregar(() => (id ? this.api.grade(id) : this.api.gradeAtual()));
    });
  }

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

  /** Aula sendo arrastada (mover); a célula sob o cursor destaca-se como alvo. */
  readonly arrastando = signal<Aula | null>(null);
  /**
   * Oferta do catálogo sendo arrastada (criar). Só um dos dois arrastes está
   * ativo por vez — a origem (cartão da grade x cartão do catálogo) decide se o
   * drop MOVE uma aula existente ou CRIA uma nova.
   */
  readonly arrastandoOferta = signal<OfertaAlocavel | null>(null);
  readonly celulaAlvo = signal<string | null>(null);

  /** Conflito em foco no painel — realça as aulas envolvidas na grade. */
  readonly conflitoEmFoco = signal<Conflito | null>(null);
  /** Conflito cujo formulário de aceite está aberto. */
  readonly aceitando = signal<Conflito | null>(null);

  // ---- Cursos: a grade separada por curso --------------------------------

  readonly cursos = computed<Curso[]>(() => this.grade()?.cursos ?? []);

  /** O curso em exibição, ou `null` quando a visão é "todos os cursos". */
  private readonly cursoAtual = computed<Curso | null>(() => {
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

  private readonly turmaAtual = computed<Turma | null>(() => {
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

  /**
   * O catálogo recortado para a visão atual — mesma regra de `aulasVisiveis`:
   * turma em foco, senão o curso, senão tudo. É o que a paleta lateral desenha.
   */
  readonly ofertasCatalogo = computed<OfertaAlocavel[]>(() => {
    const todas = this.catalogo();
    const curso = this.cursoSelecionado();
    const turma = this.turmaSelecionada();
    if (turma && turma !== this.TODAS) return todas.filter((o) => o.turmaId === turma);
    if (!curso || curso === this.TODOS) return todas;
    return todas.filter((o) => o.cursoId === curso);
  });

  /** Todas as aulas por id (inclusive as ocultas) — resolve os envolvidos num conflito. */
  private readonly aulaPorId = computed<Map<string, Aula>>(
    () => new Map((this.grade()?.aulas ?? []).map((a) => [a.id, a])),
  );

  private readonly siglaPorCurso = computed<Map<string, string>>(
    () => new Map(this.cursos().map((c) => [c.id, c.sigla])),
  );

  /**
   * Trocar de curso troca também de turma: a turma anterior é de outro curso e
   * deixaria a tabela vazia. Cai na primeira turma do curso novo — a grade de
   * uma turma é o que a comissão veio montar.
   */
  selecionarCurso(id: string): void {
    this.cursoSelecionado.set(id);
    this.turmaSelecionada.set(this.primeiraTurmaDoCurso(id));
    this.conflitoEmFoco.set(null);
    this.aceitando.set(null);
  }

  selecionarTurma(id: string): void {
    this.turmaSelecionada.set(id);
    this.conflitoEmFoco.set(null);
    this.aceitando.set(null);
  }

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

  private readonly slotPorCelula = computed(() => {
    const mapa = new Map<string, Slot>();
    for (const s of this.grade()?.slots ?? []) {
      mapa.set(chaveCelula(s.diaSemana, s.turno, s.ordem), s);
    }
    return mapa;
  });

  /** Pior severidade que toca cada aula — governa a cor do cartão. */
  private readonly severidadePorAula = computed(() =>
    mapaSeveridadePorAula(this.grade()?.conflitos ?? []),
  );

  /**
   * As linhas prontas da tabela: uma por (turno, ordem) do turno em exibição, já
   * com as cinco células (Seg–Sex) e as aulas resolvidas. A montagem em si é
   * compartilhada com as consultas de grade (`montarLinhas`); aqui só se decide o
   * recorte — as aulas visíveis e os turnos do curso em foco.
   */
  readonly linhas = computed<LinhaVm[]>(() =>
    montarLinhas(
      this.aulasVisiveis(),
      this.grade()?.slots ?? [],
      this.severidadePorAula(),
      this.siglaPorCurso(),
      this.turnosVisiveis(),
    ),
  );

  /** Ids das aulas envolvidas no conflito em foco — a tabela as realça. */
  readonly idsEmFoco = computed<Set<string>>(
    () => new Set(this.conflitoEmFoco()?.alocacoesEnvolvidas ?? []),
  );

  // ---- Conflitos ---------------------------------------------------------

  /**
   * Os conflitos que tocam o curso em exibição — inclusive os que ele divide com
   * outro curso (um professor em dois cursos no mesmo horário aparece na grade
   * dos DOIS). Cada um já traz as turmas de fora resolvidas para o painel.
   */
  readonly conflitos = computed<ConflitoVm[]>(() => {
    const visiveis = new Set(this.aulasVisiveis().map((a) => a.id));
    return [...(this.grade()?.conflitos ?? [])]
      .filter((c) => c.alocacoesEnvolvidas.some((id) => visiveis.has(id)))
      .sort((a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade])
      .map((conflito) => ({ conflito, outrasTurmas: this.outrasTurmas(conflito, visiveis) }));
  });

  /**
   * As turmas envolvidas no conflito que NÃO estão na tabela em exibição — de
   * outro período do mesmo curso ou de outro curso. Sem isto, a comissão vê um
   * conflito acusando uma aula que não está na tela e não tem como saber de onde
   * ela veio: o professor de SI que também dá aula no 3º período é exatamente o
   * caso que mais aparece.
   */
  private outrasTurmas(conflito: Conflito, visiveis: Set<string>): string[] {
    const nomes = new Set<string>();
    for (const id of conflito.alocacoesEnvolvidas) {
      if (visiveis.has(id)) continue;
      const aula = this.aulaPorId().get(id);
      if (aula?.turma) nomes.add(aula.turma);
    }
    return [...nomes];
  }

  readonly totaisPorSeveridade = computed<Record<Severidade, number>>(() => {
    const t: Record<Severidade, number> = { FORTE: 0, POTENCIAL: 0, FRACO: 0 };
    for (const { conflito } of this.conflitos()) t[conflito.severidade]++;
    return t;
  });

  /** De onde o painel está falando — governa o cabeçalho e a mensagem de grade limpa. */
  readonly escopoConflitos = computed<EscopoConflitos>(() => {
    const turma = this.turmaAtual();
    if (turma) return { nivel: 'turma', rotulo: turma.nome };
    const curso = this.cursoAtual();
    if (curso) return { nivel: 'curso', rotulo: curso.sigla };
    return { nivel: 'todos', rotulo: null };
  });

  readonly aceitandoChave = computed(() => this.aceitando()?.chave ?? null);

  // ---- Ações -------------------------------------------------------------

  aoIniciarArraste(aula: Aula): void {
    this.arrastando.set(aula);
  }

  /** Começou a arrastar uma oferta do catálogo — o drop numa célula vai criá-la. */
  aoIniciarArrasteOferta(oferta: OfertaAlocavel): void {
    this.arrastandoOferta.set(oferta);
  }

  aoTerminarArraste(): void {
    this.arrastando.set(null);
    this.arrastandoOferta.set(null);
    this.celulaAlvo.set(null);
  }

  aoSobrevoar({ celula, evento }: EventoCelula): void {
    // Qualquer um dos dois arrastes (mover aula ou criar do catálogo) habilita a
    // célula como alvo. preventDefault é o que autoriza o drop no HTML5.
    if (!this.arrastando() && !this.arrastandoOferta()) return;
    evento.preventDefault();
    this.celulaAlvo.set(chaveCelula(celula.dia, celula.turno, celula.ordem));
  }

  aoSoltar({ celula, evento }: EventoCelula): void {
    evento.preventDefault();
    // Captura as duas origens ANTES de limpar o estado do arraste.
    const aula = this.arrastando();
    const oferta = this.arrastandoOferta();
    const slotDestino = this.slotPorCelula().get(
      chaveCelula(celula.dia, celula.turno, celula.ordem),
    );
    this.aoTerminarArraste();
    if (!slotDestino) return;

    // Origem = catálogo: cria a aula nova naquele slot (sala fica nula).
    if (oferta) {
      this.executar(() => this.api.criar(oferta.ofertaId, slotDestino.id));
      return;
    }

    // Origem = grade: move a aula existente (a menos que solte no mesmo lugar).
    if (!aula) return;
    if (aula.slot?.id === slotDestino.id) return;
    this.executar(() => this.api.mover(aula.id, slotDestino.id, aula.version));
  }

  remover(aula: Aula): void {
    this.executar(() => this.api.remover(aula.id, aula.version));
  }

  abrirAceite(conflito: Conflito): void {
    this.aceitando.set(conflito);
  }

  cancelarAceite(): void {
    this.aceitando.set(null);
  }

  confirmarAceite({ chave, justificativa }: { chave: string; justificativa: string }): void {
    this.executar(() => this.api.aceitarConflito(chave, justificativa));
    this.aceitando.set(null);
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
      error: (e) => this.aoFalharEscrita(e),
    });
  }

  /**
   * Falha de uma escrita. O 409 é o caso da concorrência otimista: outra pessoa
   * alterou (ou fechou o período d)a aula desde que esta tela carregou. Mostra o
   * aviso do servidor E recarrega a grade — assim a tela reflete o estado novo e
   * a próxima ação já parte da versão certa, em vez de bater no mesmo 409.
   */
  private aoFalharEscrita(e: unknown): void {
    this.falhar(e);
    if ((e as { status?: number })?.status === 409) {
      this.recarregarGrade();
    }
  }

  /** Recarrega a grade do período em foco — usado após um 409 de concorrência. */
  private recarregarGrade(): void {
    const id = this.periodoCarregado ?? null;
    const fonte = id ? this.api.grade(id) : this.api.gradeAtual();
    fonte.subscribe({
      next: (g) => this.aplicarGrade(g),
      error: () => {},
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
      turma === this.TODAS || g.turmas.some((t) => t.id === turma && t.cursoId === cursoResolvido);
    if (!turmaValida) {
      this.turmaSelecionada.set(this.primeiraTurmaDoCurso(cursoResolvido ?? this.TODOS));
    }

    // Toda grade nova (carga ou escrita) pode ter mudado a carga restante das
    // ofertas — remover uma aula devolve uma vaga ao catálogo. Recarrega por
    // aqui, o choke point por onde toda grade passa. Usa o id JÁ resolvido que
    // o servidor devolve (funciona mesmo quando a carga veio de `gradeAtual`).
    this.carregarCatalogo(g.periodoLetivoId);
  }

  /**
   * Busca o catálogo de ofertas a alocar. É auxiliar: se falhar, esvazia a
   * paleta em silêncio em vez de derrubar a tela da grade — a grade em si já
   * carregou e o erro dela tem tratamento próprio.
   */
  private carregarCatalogo(periodoId: string): void {
    this.api.ofertasAlocaveis(periodoId).subscribe({
      next: (ofertas) => this.catalogo.set(ofertas),
      error: () => this.catalogo.set([]),
    });
  }

  private falhar(e: unknown): void {
    this.carregando.set(false);
    const msg =
      (e as { error?: { message?: string } })?.error?.message ??
      'Não foi possível falar com o servidor. Confira se o backend está no ar (porta 3000).';
    this.erro.set(Array.isArray(msg) ? msg.join(' ') : msg);
  }
}
