/**
 * Consulta de grade — a MESMA tabela do planejamento, mas pivotada por uma
 * dimensão que a tela de planejamento não mostra: por professor ou por sala.
 * Enquanto o planejamento recorta a grade por curso › turma, aqui a comissão
 * pergunta "onde esse professor está a semana toda?" ou "o que roda nesta sala?".
 * É só leitura — não move nem cria aula; para isso existe o Planejamento.
 *
 * Uma única classe atende às duas telas: a rota diz a `dimensao` (`professor` |
 * `sala`) em `data`, e daí saem a lista de opções, o filtro e os rótulos. Os
 * conflitos continuam acendendo na tabela (um professor em duas aulas fica
 * vermelho aqui também) e são listados ao lado, sem o botão de aceitar — decidir
 * conviver com um conflito é ação de edição, feita no Planejamento.
 */
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { GradeApi } from '../../core/api/grade-api';
import { PeriodoState } from '../../core/state/periodo-state';
import { Aula, Conflito, Grade } from '../../core/models/grade.models';
import { GradeTabelaComponent } from '../grade/components/grade-tabela/grade-tabela';
import { LinhaVm, mapaSeveridadePorAula, montarLinhas } from '../grade/grade.view';
import { SEVERIDADE_RANK, pillSeveridade, rotuloSeveridade, rotuloTipo } from '../grade/severidade';

type Dimensao = 'professor' | 'sala';

@Component({
  selector: 'app-grade-consulta',
  imports: [FormsModule, GradeTabelaComponent, ...HlmSelectImports],
  templateUrl: './grade-consulta.html',
})
export class GradeConsultaComponent {
  private readonly api = inject(GradeApi);
  readonly periodo = inject(PeriodoState);

  /** Qual dimensão esta instância pivota — vem do `data` da rota. */
  readonly dimensao = (inject(ActivatedRoute).snapshot.data['dimensao'] ?? 'professor') as Dimensao;
  readonly rotuloDimensao = this.dimensao === 'professor' ? 'Professor' : 'Sala';

  readonly grade = signal<Grade | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  /** A opção (nome de professor ou de sala) em exibição. */
  readonly selecionado = signal<string | null>(null);

  /** Id do período já carregado — evita recarregar quando o foco não mudou. */
  private periodoCarregado: string | null | undefined;

  constructor() {
    // A consulta acompanha o período em foco no cabeçalho, igual ao planejamento.
    effect(() => {
      const foco = this.periodo.selecionado();
      const id = foco?.id ?? null;
      if (id === this.periodoCarregado) return;
      this.periodoCarregado = id;
      this.carregar(() => (id ? this.api.grade(id) : this.api.gradeAtual()));
    });
  }

  /**
   * Todos os nomes (professores ou salas) que têm aula no período, ordenados. A
   * lista sai da própria grade carregada — só interessa consultar quem de fato
   * aparece nela, então não é preciso um endpoint à parte.
   */
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

  /** As aulas da seleção — as que o professor dá, ou as que rodam na sala. */
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

  /**
   * Os turnos que a seleção ocupa — a tabela desenha só essas faixas. Um
   * professor pode dar aula em turnos diferentes ao longo da semana, então não há
   * um "turno padrão" como no curso: mostra-se a união do que ele de fato ocupa.
   */
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

  /**
   * Os conflitos que tocam a seleção, do mais grave ao menos — a mesma cor que
   * acende na tabela, agora com o texto do que aconteceu. Só leitura: aceitar é
   * ação do Planejamento.
   */
  readonly conflitos = computed<Conflito[]>(() => {
    const ids = new Set(this.aulasDaSelecao().map((a) => a.id));
    return [...(this.grade()?.conflitos ?? [])]
      .filter((c) => c.alocacoesEnvolvidas.some((id) => ids.has(id)))
      .sort((a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade]);
  });

  selecionar(nome: string): void {
    this.selecionado.set(nome);
  }

  pill = (sev: Conflito['severidade']): string => pillSeveridade(sev);
  rotuloSev = (sev: Conflito['severidade']): string => rotuloSeveridade(sev);
  rotuloTipoConflito = (tipo: string): string => rotuloTipo(tipo);

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

  /**
   * Guarda a grade e garante que a seleção continue válida: ao trocar de período
   * (ou na primeira carga) cai na primeira opção, para a tela nunca abrir vazia
   * com dados disponíveis.
   */
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
