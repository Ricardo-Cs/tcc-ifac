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
import { OpcaoBusca, SelectBuscaComponent } from '../select-busca/select-busca';
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
  busca?: boolean;
}

const TODOS = '__todos__';

const FACETA_LONGA = 8;

@Component({
  selector: 'app-listagem',
  imports: [
    FormsModule,
    NgTemplateOutlet,
    NgIcon,
    HlmButton,
    HlmInput,
    SelectBuscaComponent,
    ...HlmSelectImports,
  ],
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
  readonly itens = input.required<T[]>();
  readonly colunas = input.required<ColunaListagem[]>();
  readonly filtros = input<FiltroListagem<T>[]>([]);
  readonly entidade = input('registros');
  readonly camposBusca = input<string[]>([]);
  readonly tamanhoPagina = input(8);
  readonly mostrarAdicionar = input(true);
  readonly mostrarImportar = input(true);
  readonly textoBusca = input<(item: T) => string>((item) =>
    Object.values(item as Record<string, unknown>).join(' '),
  );

  readonly adicionar = output<void>();
  readonly importar = output<void>();

  private readonly linhaDir = contentChild.required(ListagemLinhaDirective);
  protected readonly linha = computed(() => this.linhaDir().template);

  protected readonly placeholderBusca = computed(() => {
    const campos = this.camposBusca();
    return campos.length ? `Buscar por ${campos.join(', ')}…` : `Buscar ${this.entidade()}…`;
  });

  protected readonly TODOS = TODOS;
  protected readonly termo = signal('');
  private readonly selecoes = signal<Record<string, string>>({});
  private readonly pagina = signal(1);

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

  protected readonly opcoesBuscaPorFiltro = computed(() => {
    const mapa = new Map<string, OpcaoBusca[]>();
    const porBusca = new Set(
      this.filtros()
        .filter((f) => f.busca)
        .map((f) => f.chave),
    );
    for (const [chave, opcoes] of this.opcoesPorFiltro()) {
      if (!porBusca.has(chave) && opcoes.length <= FACETA_LONGA) continue;
      mapa.set(chave, [
        { valor: TODOS, rotulo: 'Todos' },
        ...opcoes.map((o) => ({ valor: o.valor, rotulo: o.rotulo ?? o.valor })),
      ]);
    }
    return mapa;
  });

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

  protected readonly paginaAtual = computed(() => Math.min(this.pagina(), this.totalPaginas()));

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

  protected valorFiltroBusca(chave: string): string {
    const valor = this.valorFiltro(chave);
    return valor === TODOS ? '' : valor;
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
