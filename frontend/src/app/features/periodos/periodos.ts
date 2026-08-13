/**
 * Cadastro de Períodos letivos — o mesmo molde de Cursos (listagem + diálogo),
 * aplicado à entidade que o `PeriodoState` usa como estado do sistema.
 *
 * Regra própria daqui: só UM período é o corrente (`ativo`) — é o padrão que o
 * seletor do header assume e o alvo de "editável". Marcar um como corrente
 * desmarca os demais, para nunca haver dois correntes.
 *
 * Ainda SEM endpoint: lista em memória, semeada com um retrato representativo. O
 * formulário funciona de verdade; só não persiste no servidor.
 */
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { Periodo } from '../../core/models/grade.models';
import { ToastService } from '../../core/toast';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** Fases de um período; o rótulo humaniza o código guardado em `status`. */
const STATUS = [
  { valor: 'PLANEJAMENTO', rotulo: 'Planejamento' },
  { valor: 'ABERTO', rotulo: 'Aberto' },
  { valor: 'FECHADO', rotulo: 'Fechado' },
] as const;

/** O rascunho do formulário — um Periodo sem id, resolvido no salvar. */
type RascunhoPeriodo = Omit<Periodo, 'id'>;

const RASCUNHO_VAZIO: RascunhoPeriodo = {
  codigo: '',
  descricao: '',
  status: 'PLANEJAMENTO',
  ativo: false,
};

/** Retrato representativo (dados fictícios): um corrente e dois já fechados. */
const PERIODOS: Periodo[] = [
  { id: '2026-2', codigo: '2026.2', descricao: 'Segundo semestre de 2026', status: 'ABERTO', ativo: true },
  { id: '2026-1', codigo: '2026.1', descricao: 'Primeiro semestre de 2026', status: 'FECHADO', ativo: false },
  { id: '2025-2', codigo: '2025.2', descricao: 'Segundo semestre de 2025', status: 'FECHADO', ativo: false },
];

@Component({
  selector: 'app-periodos',
  imports: [
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    ListagemComponent,
    ListagemLinhaDirective,
    ...HlmSelectImports,
    ...HlmDialogImports,
  ],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  templateUrl: './periodos.html',
})
export class PeriodosComponent {
  private readonly toast = inject(ToastService);

  readonly statusOpcoes = STATUS;

  readonly periodos = signal<Periodo[]>(PERIODOS);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Código', largura: 'w-32' },
    { rotulo: 'Descrição' },
    { rotulo: 'Status', largura: 'w-40' },
    { rotulo: 'Corrente', largura: 'w-28' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Periodo>[] = [
    { chave: 'status', rotulo: 'Status', valor: (p) => this.rotuloStatus(p.status) },
  ];

  readonly textoBusca = (p: Periodo): string => `${p.codigo} ${p.descricao ?? ''}`;

  // ---- Diálogo de formulário --------------------------------------------

  readonly editando = signal<Periodo | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoPeriodo>(RASCUNHO_VAZIO);

  readonly removendo = signal<Periodo | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar período' : 'Novo período',
  );

  // Arrow field para servir de `itemToString` do hlm-select: o trigger deriva o
  // texto do VALOR selecionado, não do conteúdo do item — sem isto mostraria o
  // código cru (ex.: "PLANEJAMENTO").
  readonly rotuloStatus = (valor: string): string =>
    STATUS.find((s) => s.valor === valor)?.rotulo ?? valor;

  atualizar<K extends keyof RascunhoPeriodo>(campo: K, valor: RascunhoPeriodo[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(periodo: Periodo): void {
    this.editando.set(periodo);
    const { codigo, descricao, status, ativo } = periodo;
    this.rascunho.set({ codigo, descricao, status, ativo });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const codigo = r.codigo.trim();
    if (!codigo || !r.status) {
      this.toast.erro('Preencha os campos', 'Código e status são obrigatórios.');
      return;
    }

    const alvo = this.editando();
    const duplicado = this.periodos().some(
      (p) => p.codigo === codigo && p.id !== alvo?.id,
    );
    if (duplicado) {
      this.toast.erro('Código já usado', `Já existe o período ${codigo}.`);
      return;
    }

    const descricao = r.descricao?.trim() ? r.descricao.trim() : null;
    const salvo: Periodo = alvo
      ? { ...alvo, codigo, descricao, status: r.status, ativo: r.ativo }
      : { id: crypto.randomUUID(), codigo, descricao, status: r.status, ativo: r.ativo };

    this.periodos.update((lista) => {
      const proxima = alvo ? lista.map((p) => (p.id === alvo.id ? salvo : p)) : [...lista, salvo];
      // Só um corrente: marcar este como ativo apaga o de todos os outros.
      return salvo.ativo ? proxima.map((p) => (p.id === salvo.id ? p : { ...p, ativo: false })) : proxima;
    });

    this.toast.sucesso(
      `${codigo} ${alvo ? 'atualizado' : 'cadastrado'}`,
      'Alteração só na tela — sem endpoint de períodos ainda.',
    );
    this.fecharDialog();
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(periodo: Periodo): void {
    this.removendo.set(periodo);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    if (alvo.ativo) {
      this.toast.erro('Período corrente', 'Defina outro período como corrente antes de remover este.');
      this.removendo.set(null);
      return;
    }
    this.periodos.update((lista) => lista.filter((p) => p.id !== alvo.id));
    this.toast.sucesso(`${alvo.codigo} removido`, 'Remoção só na tela — sem endpoint de períodos ainda.');
    this.removendo.set(null);
  }
}
