import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { GradeApi } from '../../core/api/grade-api';
import { formatarHoras } from '../../core/format/horas';
import { PeriodoState } from '../../core/state/periodo-state';
import { Aula, Conflito, Grade } from '../../core/models/grade.models';
import { GradeTabelaComponent } from '../grade/components/grade-tabela/grade-tabela';
import { LinhaVm, mapaSeveridadePorAula, montarLinhas } from '../grade/grade.view';
import { SEVERIDADE_RANK, pillSeveridade, rotuloSeveridade, rotuloTipo } from '../grade/severidade';

type Dimensao = 'professor' | 'sala';

@Component({
  selector: 'app-grade-consulta',
  imports: [GradeTabelaComponent, ...HlmComboboxImports],
  templateUrl: './grade-consulta.html',
})
export class GradeConsultaComponent {
  private readonly api = inject(GradeApi);
  readonly periodo = inject(PeriodoState);

  readonly dimensao = (inject(ActivatedRoute).snapshot.data['dimensao'] ?? 'professor') as Dimensao;
  readonly rotuloDimensao = this.dimensao === 'professor' ? 'Professor' : 'Sala';

  readonly grade = signal<Grade | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly selecionado = signal<string | null>(null);

  private periodoCarregado: string | null | undefined;

  constructor() {
    effect(() => {
      const foco = this.periodo.selecionado();
      const id = foco?.id ?? null;
      if (id === this.periodoCarregado) return;
      this.periodoCarregado = id;
      this.carregar(() => (id ? this.api.grade(id) : this.api.gradeAtual()));
    });
  }

  readonly opcoes = computed<string[]>(() => {
    const nomes = new Set<string>();
    for (const a of this.grade()?.aulas ?? []) {
      if (this.dimensao === 'professor') {
        for (const p of a.professores) nomes.add(p);
      } else if (a.sala) {
        nomes.add(a.sala);
      }
    }
    return [...nomes].sort((x, y) => x.localeCompare(y, 'pt-BR'));
  });

  readonly cargaDoSelecionado = computed<number | null>(() => {
    if (this.dimensao !== 'professor') return null;
    const nome = this.selecionado();
    if (!nome) return null;
    const professor = (this.grade()?.professores ?? []).find((p) => p.nome === nome);
    return professor?.cargaHorariaAtual ?? null;
  });

  private readonly aulasDaSelecao = computed<Aula[]>(() => {
    const sel = this.selecionado();
    if (!sel) return [];
    return (this.grade()?.aulas ?? []).filter((a) =>
      this.dimensao === 'professor' ? a.professores.includes(sel) : a.sala === sel,
    );
  });

  private readonly severidadePorAula = computed(() =>
    mapaSeveridadePorAula(this.grade()?.conflitos ?? []),
  );

  private readonly siglaPorCurso = computed(
    () => new Map((this.grade()?.cursos ?? []).map((c) => [c.id, c.sigla])),
  );

  private readonly turnos = computed<Set<string> | null>(() => {
    const set = new Set<string>();
    for (const a of this.aulasDaSelecao()) {
      if (a.slot) set.add(a.slot.turno);
    }
    return set.size ? set : null;
  });

  readonly linhas = computed<LinhaVm[]>(() =>
    montarLinhas(
      this.aulasDaSelecao(),
      this.grade()?.slots ?? [],
      this.severidadePorAula(),
      this.siglaPorCurso(),
      this.turnos(),
    ),
  );

  readonly conflitos = computed<Conflito[]>(() => {
    const ids = new Set(this.aulasDaSelecao().map((a) => a.id));
    return [...(this.grade()?.conflitos ?? [])]
      .filter((c) => c.alocacoesEnvolvidas.some((id) => ids.has(id)))
      .sort((a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade]);
  });

  selecionar(nome: string | null | undefined): void {
    this.selecionado.set(nome ?? null);
  }

  pill = (sev: Conflito['severidade']): string => pillSeveridade(sev);
  rotuloSev = (sev: Conflito['severidade']): string => rotuloSeveridade(sev);
  rotuloTipoConflito = (tipo: string): string => rotuloTipo(tipo);

  cargaFormatada(horas: number): string {
    return formatarHoras(horas);
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

  private aplicarGrade(g: Grade): void {
    this.grade.set(g);
    const ops = this.opcoes();
    const atual = this.selecionado();
    if (ops.length && (atual === null || !ops.includes(atual))) {
      this.selecionado.set(ops[0]);
    } else if (!ops.length) {
      this.selecionado.set(null);
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
