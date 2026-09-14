import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';

export interface OpcaoBusca {
  valor: string;
  rotulo: string;
  detalhe?: string;
  marcador?: string;
  desabilitado?: boolean;
}

const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');

@Component({
  selector: 'app-select-busca',
  imports: [...HlmComboboxImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './select-busca.html',
})
export class SelectBuscaComponent {
  readonly opcoes = input.required<readonly OpcaoBusca[]>();
  readonly valor = input<string | null>('');
  readonly placeholder = input('Selecione');
  readonly vazio = input('Nada encontrado.');
  readonly desabilitado = input(false);
  readonly limpavel = input(true);

  readonly valorChange = output<string>();

  private readonly porValor = computed(
    () => new Map(this.opcoes().map((o) => [o.valor, o] as const)),
  );

  private readonly textoBusca = computed(() => {
    const mapa = new Map<string, string>();
    for (const o of this.opcoes()) {
      mapa.set(o.valor, normalizar(`${o.rotulo} ${o.detalhe ?? ''}`));
    }
    return mapa;
  });

  protected readonly selecionado = computed(() => this.valor() || null);

  protected readonly rotuloDoValor = (valor: string): string =>
    this.porValor().get(valor)?.rotulo ?? '';

  protected readonly filtrar = (valor: string, busca: string): boolean => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean);
    if (!termos.length) return true;
    const texto = this.textoBusca().get(valor) ?? '';
    return termos.every((t) => texto.includes(t));
  };

  protected escolher(valor: string | null | undefined): void {
    this.valorChange.emit(valor ?? '');
  }
}
