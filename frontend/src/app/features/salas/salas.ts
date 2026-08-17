/**
 * Cadastro de Salas — segue o molde de Cursos (listagem + diálogo de
 * formulário), integrado ao backend (`SalasController`): a lista vem de
 * `GET /salas` e o salvar/remover chamam POST/PATCH/DELETE. A unicidade do nome
 * é decidida pelo servidor (409) — a tela traduz a resposta em toast.
 */
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AcademicoApi } from '../../core/api/academico-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sala, TipoSala } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** Tipos de sala — código do domínio + rótulo humano para exibir/filtrar. */
const TIPOS_SALA = [
  { valor: 'COMUM', rotulo: 'Comum' },
  { valor: 'LABORATORIO', rotulo: 'Laboratório' },
  { valor: 'AUDITORIO', rotulo: 'Auditório' },
  { valor: 'QUADRA', rotulo: 'Quadra' },
] as const;

/** O rascunho do formulário — os campos editáveis de uma sala. */
interface RascunhoSala {
  nome: string;
  tipo: TipoSala | '';
  capacidade: number | null;
}

const RASCUNHO_VAZIO: RascunhoSala = { nome: '', tipo: '', capacidade: null };

@Component({
  selector: 'app-salas',
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
  templateUrl: './salas.html',
})
export class SalasComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly tiposSala = TIPOS_SALA;

  readonly salas = signal<Sala[]>([]);
  /** true enquanto o salvar/remover está em voo — trava os botões do diálogo. */
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Nome' },
    { rotulo: 'Tipo', largura: 'w-48' },
    { rotulo: 'Capacidade', largura: 'w-32' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Sala>[] = [
    { chave: 'tipo', rotulo: 'Tipo', valor: (s) => this.rotuloTipo(s.tipo) },
  ];

  readonly textoBusca = (s: Sala): string => s.nome;

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.api.listarSalas().subscribe({
      next: (salas) => this.salas.set(salas),
      error: (err) =>
        this.toast.erro(
          'Falha ao carregar salas',
          mensagemErro(err, 'Tente novamente.'),
        ),
    });
  }

  // Arrow field para servir de `itemToString` do hlm-select: o trigger deriva
  // seu texto do VALOR selecionado, não do conteúdo do item.
  readonly rotuloTipo = (valor: string): string =>
    TIPOS_SALA.find((t) => t.valor === valor)?.rotulo ?? valor;

  // ---- Diálogo de formulário --------------------------------------------

  /** Sala em edição, ou `null` quando o diálogo está criando uma nova. */
  readonly editando = signal<Sala | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoSala>(RASCUNHO_VAZIO);

  /** Sala à espera de confirmação de remoção — abre o diálogo de confirmar. */
  readonly removendo = signal<Sala | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar sala' : 'Nova sala',
  );

  atualizar<K extends keyof RascunhoSala>(
    campo: K,
    valor: RascunhoSala[K],
  ): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(sala: Sala): void {
    this.editando.set(sala);
    const { nome, tipo, capacidade } = sala;
    this.rascunho.set({ nome, tipo, capacidade });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    if (!nome || !r.tipo) {
      this.toast.erro(
        'Preencha os campos obrigatórios',
        'Nome e tipo são obrigatórios.',
      );
      return;
    }

    const dados = {
      nome,
      tipo: r.tipo,
      capacidade: r.capacidade ?? null,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarSala(alvo.id, dados)
      : this.api.criarSala(dados);

    requisicao.subscribe({
      next: (sala) => {
        this.salas.update((lista) =>
          alvo
            ? lista.map((s) => (s.id === sala.id ? sala : s))
            : [...lista, sala],
        );
        this.toast.sucesso(`${sala.nome} ${alvo ? 'atualizada' : 'cadastrada'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar a sala.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(sala: Sala): void {
    this.removendo.set(sala);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerSala(alvo.id).subscribe({
      next: () => {
        this.salas.update((lista) => lista.filter((s) => s.id !== alvo.id));
        this.toast.sucesso(`${alvo.nome} removida`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover a sala.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
