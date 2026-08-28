import { Component, computed, effect, inject, signal } from '@angular/core';
import { AcademicoApi } from '../../core/api/academico-api';
import { GradeApi } from '../../core/api/grade-api';
import { PeriodosApi } from '../../core/api/periodos-api';
import { mensagemErro } from '../../core/api/erro-http';
import { PeriodoState } from '../../core/state/periodo-state';
import { ToastService } from '../../core/toast';
import { Sala } from '../../core/models/academico.models';
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
import { SalaDialogComponent } from './components/sala-dialog/sala-dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { SEVERIDADE_RANK } from './severidade';
import {
  ConflitoVm,
  EscopoConflitos,
  LinhaVm,
  TODAS_AS_TURMAS,
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
    SalaDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './grade.html',
})
export class GradeComponent {
  private readonly api = inject(GradeApi);
  private readonly academico = inject(AcademicoApi);
  private readonly periodosApi = inject(PeriodosApi);
  private readonly toast = inject(ToastService);

  readonly periodo = inject(PeriodoState);

  readonly TODAS = TODAS_AS_TURMAS;

  readonly grade = signal<Grade | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly catalogo = signal<OfertaAlocavel[]>([]);

  readonly salas = signal<Sala[]>([]);

  private periodoCarregado: string | null | undefined;

  constructor() {
    effect(() => {
      const foco = this.periodo.selecionado();
      const id = foco?.id ?? null;
      if (id === this.periodoCarregado) return;
      this.periodoCarregado = id;
      this.carregar(() => (id ? this.api.grade(id) : this.api.gradeAtual()));
    });

    this.academico.listarSalas().subscribe({
      next: (salas) => this.salas.set(salas),
      error: () => this.salas.set([]),
    });
  }

  readonly cursoSelecionado = signal<string | null>(null);

  readonly turmaSelecionada = signal<string | null>(null);

  readonly arrastando = signal<Aula | null>(null);

  readonly arrastandoOferta = signal<OfertaAlocavel | null>(null);
  readonly celulaAlvo = signal<string | null>(null);

  readonly conflitoEmFoco = signal<Conflito | null>(null);
  readonly aceitando = signal<Conflito | null>(null);

  readonly definindoSala = signal<Aula | null>(null);
  readonly salvandoSala = signal(false);

  readonly confirmandoPublicacao = signal(false);
  readonly publicando = signal(false);

  readonly cursos = computed<Curso[]>(() => this.grade()?.cursos ?? []);

  private readonly cursoAtual = computed<Curso | null>(() => {
    const id = this.cursoSelecionado();
    return this.cursos().find((c) => c.id === id) ?? null;
  });

  readonly turmasDoCurso = computed<Turma[]>(() => {
    const turmas = this.grade()?.turmas ?? [];
    const curso = this.cursoSelecionado();
    if (!curso) return turmas;
    return turmas.filter((t) => t.cursoId === curso);
  });

  private readonly turmaAtual = computed<Turma | null>(() => {
    const id = this.turmaSelecionada();
    return this.turmasDoCurso().find((t) => t.id === id) ?? null;
  });

  readonly vendoVariasTurmas = computed(() => this.turmaSelecionada() === this.TODAS);

  private readonly aulasVisiveis = computed<Aula[]>(() => {
    const todas = this.grade()?.aulas ?? [];
    const curso = this.cursoSelecionado();
    const turma = this.turmaSelecionada();
    if (turma && turma !== this.TODAS) return todas.filter((a) => a.turmaId === turma);
    if (!curso) return todas;
    return todas.filter((a) => a.cursoId === curso);
  });

  readonly ofertasCatalogo = computed<OfertaAlocavel[]>(() => {
    const todas = this.catalogo();
    const curso = this.cursoSelecionado();
    const turma = this.turmaSelecionada();
    if (turma && turma !== this.TODAS) return todas.filter((o) => o.turmaId === turma);
    if (!curso) return todas;
    return todas.filter((o) => o.cursoId === curso);
  });

  private readonly aulaPorId = computed<Map<string, Aula>>(
    () => new Map((this.grade()?.aulas ?? []).map((a) => [a.id, a])),
  );

  private readonly siglaPorCurso = computed<Map<string, string>>(
    () => new Map(this.cursos().map((c) => [c.id, c.sigla])),
  );

  readonly salasOcupadas = computed<Set<string>>(() => {
    const aula = this.definindoSala();
    const slotId = aula?.slot?.id;
    if (!slotId) return new Set<string>();
    const ocupadas = new Set<string>();
    for (const outra of this.grade()?.aulas ?? []) {
      if (outra.id === aula.id) continue;
      if (outra.slot?.id !== slotId) continue;
      if (outra.salaId) ocupadas.add(outra.salaId);
    }
    return ocupadas;
  });

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

  private primeiraTurmaDoCurso(cursoId: string): string {
    const turmas = this.grade()?.turmas ?? [];
    return turmas.find((t) => t.cursoId === cursoId)?.id ?? TODAS_AS_TURMAS;
  }

  private readonly turnosVisiveis = computed<Set<string> | null>(() => {
    const curso = this.cursoAtual();
    if (!curso) return null;
    const turnos = new Set<string>([curso.turnoPadrao]);
    if (curso.modalidade === 'INTEGRADO') turnos.add('TARDE');
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

  private readonly severidadePorAula = computed(() =>
    mapaSeveridadePorAula(this.grade()?.conflitos ?? []),
  );

  readonly linhas = computed<LinhaVm[]>(() =>
    montarLinhas(
      this.aulasVisiveis(),
      this.grade()?.slots ?? [],
      this.severidadePorAula(),
      this.siglaPorCurso(),
      this.turnosVisiveis(),
    ),
  );

  readonly idsEmFoco = computed<Set<string>>(
    () => new Set(this.conflitoEmFoco()?.alocacoesEnvolvidas ?? []),
  );

  readonly conflitos = computed<ConflitoVm[]>(() => {
    const visiveis = new Set(this.aulasVisiveis().map((a) => a.id));
    return [...(this.grade()?.conflitos ?? [])]
      .filter((c) => c.alocacoesEnvolvidas.some((id) => visiveis.has(id)))
      .sort((a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade])
      .map((conflito) => ({ conflito, outrasTurmas: this.outrasTurmas(conflito, visiveis) }));
  });

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

  readonly escopoConflitos = computed<EscopoConflitos>(() => {
    const turma = this.turmaAtual();
    if (turma) return { nivel: 'turma', rotulo: turma.nome };
    const curso = this.cursoAtual();
    if (curso) return { nivel: 'curso', rotulo: curso.sigla };
    return { nivel: 'todos', rotulo: null };
  });

  readonly aceitandoChave = computed(() => this.aceitando()?.chave ?? null);

  aoIniciarArraste(aula: Aula): void {
    this.arrastando.set(aula);
  }

  aoIniciarArrasteOferta(oferta: OfertaAlocavel): void {
    this.arrastandoOferta.set(oferta);
  }

  aoTerminarArraste(): void {
    this.arrastando.set(null);
    this.arrastandoOferta.set(null);
    this.celulaAlvo.set(null);
  }

  aoSobrevoar({ celula, evento }: EventoCelula): void {
    if (!this.arrastando() && !this.arrastandoOferta()) return;
    evento.preventDefault();
    this.celulaAlvo.set(chaveCelula(celula.dia, celula.turno, celula.ordem));
  }

  aoSoltar({ celula, evento }: EventoCelula): void {
    evento.preventDefault();
    const aula = this.arrastando();
    const oferta = this.arrastandoOferta();
    const slotDestino = this.slotPorCelula().get(
      chaveCelula(celula.dia, celula.turno, celula.ordem),
    );
    this.aoTerminarArraste();
    if (!slotDestino) return;

    if (oferta) {
      this.executar(() => this.api.criar(oferta.ofertaId, slotDestino.id));
      return;
    }

    if (!aula) return;
    if (aula.slot?.id === slotDestino.id) return;
    this.executar(() => this.api.mover(aula.id, slotDestino.id, aula.version));
  }

  remover(aula: Aula): void {
    this.executar(() => this.api.remover(aula.id, aula.version));
  }

  abrirSala(aula: Aula): void {
    this.definindoSala.set(aula);
  }

  fecharSala(): void {
    this.definindoSala.set(null);
  }

  confirmarSala(salaId: string | null): void {
    const aula = this.definindoSala();
    if (!aula) return;
    if ((aula.salaId ?? null) === salaId) {
      this.fecharSala();
      return;
    }
    this.salvandoSala.set(true);
    this.erro.set(null);
    this.api.definirSala(aula.id, salaId, aula.version).subscribe({
      next: (g) => {
        this.salvandoSala.set(false);
        this.fecharSala();
        this.aplicarGrade(g);
      },
      error: (e) => {
        this.salvandoSala.set(false);
        this.fecharSala();
        this.aoFalharEscrita(e);
      },
    });
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

  pedirPublicacao(): void {
    this.confirmandoPublicacao.set(true);
  }

  cancelarPublicacao(): void {
    this.confirmandoPublicacao.set(false);
  }

  confirmarPublicacao(): void {
    const alvo = this.periodo.selecionado();
    if (!alvo) return;
    const eraPublicado = alvo.status === 'PUBLICADO';
    this.publicando.set(true);
    this.periodosApi.atualizar(alvo.id, { status: 'PUBLICADO' }).subscribe({
      next: (periodo) => {
        this.periodo.atualizarPeriodo(periodo);
        this.toast.sucesso(
          eraPublicado ? `${periodo.codigo} atualizado` : `${periodo.codigo} publicado`,
          `A grade está em /publica/${periodo.codigo}, sem necessidade de login.`,
        );
        this.publicando.set(false);
        this.confirmandoPublicacao.set(false);
      },
      error: (err) => {
        this.toast.erro(
          'Não foi possível publicar',
          mensagemErro(err, 'Verifique se há conflitos fortes na grade.'),
        );
        this.publicando.set(false);
        this.confirmandoPublicacao.set(false);
      },
    });
  }

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

  private executar(acao: () => import('rxjs').Observable<Grade>): void {
    this.erro.set(null);
    acao().subscribe({
      next: (g) => this.aplicarGrade(g),
      error: (e) => this.aoFalharEscrita(e),
    });
  }

  private aoFalharEscrita(e: unknown): void {
    this.falhar(e);
    if ((e as { status?: number })?.status === 409) {
      this.recarregarGrade();
    }
  }

  private recarregarGrade(): void {
    const id = this.periodoCarregado ?? null;
    const fonte = id ? this.api.grade(id) : this.api.gradeAtual();
    fonte.subscribe({
      next: (g) => this.aplicarGrade(g),
      error: () => {},
    });
  }

  private aplicarGrade(g: Grade): void {
    this.grade.set(g);

    const curso = this.cursoSelecionado();
    const cursoExiste = g.cursos.some((c) => c.id === curso);
    const cursoResolvido = cursoExiste ? curso : (g.cursos[0]?.id ?? null);
    if (!cursoExiste) this.cursoSelecionado.set(cursoResolvido);

    const turma = this.turmaSelecionada();
    const turmaValida =
      turma === this.TODAS || g.turmas.some((t) => t.id === turma && t.cursoId === cursoResolvido);
    if (!turmaValida) {
      this.turmaSelecionada.set(cursoResolvido ? this.primeiraTurmaDoCurso(cursoResolvido) : this.TODAS);
    }

    this.carregarCatalogo(g.periodoLetivoId);
  }

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
