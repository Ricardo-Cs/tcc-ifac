import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucidePlus,
  lucideSearch,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { ListagemLinhaDirective } from './listagem-linha';

export interface ColunaListagem {
  rotulo: string;
  alinhamento?: 'inicio' | 'centro' | 'fim';
  largura?: string;
}

export interface OpcaoFiltro {
  valor: string;
  rotulo?: string;
}

export interface FiltroListagem<T> {
  chave: string;
  rotulo: string;
  valor: (item: T) => string;
  opcoes?: OpcaoFiltro[];
}

/** Valor sentinela do "sem filtro" — some da lista de facetas ativas. */
const TODOS = '__todos__';

@Component({
  selector: 'app-listagem',
  imports: [FormsModule, NgTemplateOutlet, NgIcon, HlmButton, HlmInput, ...HlmSelectImports],
  providers: [
    provideIcons({
      lucideSearch,
      lucidePlus,
      lucideUpload,
      lucideChevronLeft,
      lucideChevronRight,
      lucideX,
    }),
  ],
  templateUrl: './listagem.html',
})
export class ListagemComponent<T> {
  /** A lista inteira — a moldura filtra e pagina em memória. */
  readonly itens = input.required<T[]>();
  readonly colunas = input.required<ColunaListagem[]>();
  readonly filtros = input<FiltroListagem<T>[]>([]);
  /** Nome da entidade no plural ("professores") — rótulo do rodapé e da busca. */
  readonly entidade = input('registros');
  readonly tamanhoPagina = input(8);
  readonly mostrarAdicionar = input(true);
  readonly mostrarImportar = input(true);
  /**
   * Texto pesquisável de um item. Por padrão concatena todos os valores; uma
   * tela pode restringir aos campos que fazem sentido buscar.
   */
  readonly textoBusca = input<(item: T) => string>((item) =>
    Object.values(item as Record<string, unknown>).join(' '),
  );

  readonly adicionar = output<void>();
  readonly importar = output<void>();

  private readonly linhaDir = contentChild.required(ListagemLinhaDirective);
  protected readonly linha = computed(() => this.linhaDir().template);

  protected readonly TODOS = TODOS;
  protected readonly termo = signal('');
  /** chave da faceta → valor escolhido; ausência = TODOS. */
  private readonly selecoes = signal<Record<string, string>>({});
  private readonly pagina = signal(1);

  /** Opções de cada faceta: as declaradas, ou deduzidas dos dados (distintas, ordenadas). */
  protected readonly opcoesPorFiltro = computed(() => {
    const mapa = new Map<string, OpcaoFiltro[]>();
    for (const f of this.filtros()) {
      if (f.opcoes) {
        mapa.set(f.chave, f.opcoes);
        continue;
      }
      const vistos = new Set<string>();
      for (const item of this.itens()) {
        const v = f.valor(item);
        if (v) vistos.add(v);
      }
      mapa.set(
        f.chave,
        [...vistos].sort().map((valor) => ({ valor })),
      );
    }
    return mapa;
  });

  /** Rótulo do gatilho de cada select: a faceta ("Regime") sem escolha, o valor com ela. */
  protected readonly rotuladores = computed(() => {
    const opcoes = this.opcoesPorFiltro();
    const mapa = new Map<string, (v: string) => string>();
    for (const f of this.filtros()) {
      const lista = opcoes.get(f.chave) ?? [];
      mapa.set(f.chave, (v) =>
        v === TODOS ? f.rotulo : (lista.find((o) => o.valor === v)?.rotulo ?? v),
      );
    }
    return mapa;
  });

  private readonly filtrados = computed(() => {
    const selecoes = this.selecoes();
    let itens = this.itens();

    for (const f of this.filtros()) {
      const escolhido = selecoes[f.chave] ?? TODOS;
      if (escolhido !== TODOS) itens = itens.filter((i) => f.valor(i) === escolhido);
    }

    const t = this.termo().trim().toLowerCase();
    if (t) {
      const texto = this.textoBusca();
      itens = itens.filter((i) => texto(i).toLowerCase().includes(t));
    }
    return itens;
  });

  protected readonly algumFiltroAtivo = computed(
    () =>
      this.termo().trim() !== '' ||
      this.filtros().some((f) => (this.selecoes()[f.chave] ?? TODOS) !== TODOS),
  );

  protected readonly total = computed(() => this.filtrados().length);
  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.tamanhoPagina())),
  );

  /** Página efetiva, presa ao intervalo válido caso o filtro encolha a lista. */
  protected readonly paginaAtual = computed(() =>
    Math.min(this.pagina(), this.totalPaginas()),
  );

  protected readonly visiveis = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.tamanhoPagina();
    return this.filtrados().slice(inicio, inicio + this.tamanhoPagina());
  });

  protected readonly intervalo = computed(() => {
    if (this.total() === 0) return { de: 0, ate: 0 };
    const de = (this.paginaAtual() - 1) * this.tamanhoPagina() + 1;
    const ate = Math.min(de + this.tamanhoPagina() - 1, this.total());
    return { de, ate };
  });

  /** Números de página a exibir, com reticências quando são muitas. */
  protected readonly paginasVisiveis = computed<(number | '…')[]>(() => {
    const total = this.totalPaginas();
    const atual = this.paginaAtual();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const vizinhos: number[] = [];
    for (let p = Math.max(2, atual - 1); p <= Math.min(total - 1, atual + 1); p++) {
      vizinhos.push(p);
    }
    const saida: (number | '…')[] = [1];
    if (vizinhos[0] > 2) saida.push('…');
    saida.push(...vizinhos);
    if (vizinhos[vizinhos.length - 1] < total - 1) saida.push('…');
    saida.push(total);
    return saida;
  });

  protected valorFiltro(chave: string): string {
    return this.selecoes()[chave] ?? TODOS;
  }

  protected classeColuna(col: ColunaListagem): string {
    const alinhamento =
      col.alinhamento === 'fim'
        ? 'text-right'
        : col.alinhamento === 'centro'
          ? 'text-center'
          : 'text-left';
    return `${alinhamento} ${col.largura ?? ''}`;
  }

  protected buscar(valor: string): void {
    this.termo.set(valor);
    this.pagina.set(1);
  }

  protected filtrar(chave: string, valor: string): void {
    this.selecoes.update((s) => ({ ...s, [chave]: valor }));
    this.pagina.set(1);
  }

  protected limpar(): void {
    this.termo.set('');
    this.selecoes.set({});
    this.pagina.set(1);
  }

  protected irPara(p: number | '…'): void {
    if (p === '…') return;
    this.pagina.set(Math.min(Math.max(1, p), this.totalPaginas()));
  }

  protected anterior(): void {
    this.irPara(this.paginaAtual() - 1);
  }

  protected proxima(): void {
    this.irPara(this.paginaAtual() + 1);
  }
}
