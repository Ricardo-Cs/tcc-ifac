/**
 * Cadastro de Professores — a primeira tela a estrear a listagem padrão
 * (`app-listagem`). Aqui ela só configura as colunas e desenha cada linha; a
 * moldura (busca, paginação, Adicionar/Importar) vem pronta do componente.
 *
 * Os dados são um retrato dos professores semeados (`grade-2026-2.seed.ts`).
 * Enquanto não há endpoint de professores, servem para exercitar a listagem; as
 * ações de linha e o Importar apenas disparam um toast — o laço visual fechado
 * sem back-end de cadastro.
 */
import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { ToastService } from '../../core/toast';
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

interface Professor {
  nome: string;
  siape: string;
  regime: string;
}

/** Retrato dos professores do seed 2026.2 (dados fictícios, representativos). */
const PROFESSORES: Professor[] = [
  { nome: 'Jonas Pontes', siape: '10000001', regime: 'G1' },
  { nome: 'Darueck Campos', siape: '10000002', regime: 'G1' },
  { nome: 'Alvaro Rios', siape: '10000003', regime: 'G1' },
  { nome: 'Mauricio Cunha', siape: '10000004', regime: 'G1' },
  { nome: 'Flavio Farias', siape: '10000005', regime: 'G1' },
  { nome: 'Ana Beatriz Lima', siape: '10000006', regime: 'G3 (40h)' },
  { nome: 'Carlos Nogueira', siape: '10000007', regime: 'G1' },
  { nome: 'Marina Lopes', siape: '10000008', regime: 'G2' },
  { nome: 'Rafael Souza', siape: '10000009', regime: 'G3 (40h)' },
  { nome: 'Patrícia Gomes', siape: '10000010', regime: 'G1' },
  { nome: 'Diego Alves', siape: '10000011', regime: 'G2' },
  { nome: 'Marlon Teixeira', siape: '10000012', regime: 'G1' },
  { nome: 'Diego Canizio', siape: '10000013', regime: 'G1' },
  { nome: 'Henrique Canizo', siape: '10000014', regime: 'G1' },
  { nome: 'Gustavo Cardial', siape: '10000015', regime: 'G1' },
  { nome: 'Tania Facanha', siape: '10000016', regime: 'G1' },
  { nome: 'Valdenir Cardoso', siape: '10000017', regime: 'G1' },
  { nome: 'Breno Silveira', siape: '10000018', regime: 'G1' },
  { nome: 'Cristiane Nogueira', siape: '10000019', regime: 'G1' },
];

@Component({
  selector: 'app-professores',
  imports: [NgIcon, HlmButton, ListagemComponent, ListagemLinhaDirective],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  templateUrl: './professores.html',
})
export class ProfessoresComponent {
  private readonly toast = inject(ToastService);

  readonly professores = PROFESSORES;
  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Nome' },
    { rotulo: 'SIAPE', largura: 'w-40' },
    { rotulo: 'Regime', largura: 'w-40' },
    { rotulo: 'Status', largura: 'w-32' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-28' },
  ];

  /** Regime é faceta: valor exato, deduzido dos próprios dados. */
  readonly filtros: FiltroListagem<Professor>[] = [
    { chave: 'regime', rotulo: 'Regime', valor: (p) => p.regime },
  ];

  /** Só nome e SIAPE fazem sentido na busca — regime/status são filtros de faceta. */
  readonly textoBusca = (p: Professor): string => `${p.nome} ${p.siape}`;

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  adicionar(): void {
    this.toast.emBreve('Cadastrar professor');
  }

  importar(): void {
    this.toast.info('Importação iniciada', 'A planilha de professores seria lida aqui.');
  }

  ver(p: Professor): void {
    this.toast.info(p.nome, `SIAPE ${p.siape} · Regime ${p.regime}`);
  }

  editar(p: Professor): void {
    this.toast.emBreve(`Editar ${p.nome}`);
  }

  remover(p: Professor): void {
    this.toast.aviso(`Remover ${p.nome}?`, 'A remoção definitiva ainda não está ligada.');
  }
}
