/**
 * Cadastro de Disciplinas — segue o molde de Cursos (listagem + diálogo de
 * formulário), integrado ao backend (`DisciplinasController`): a lista vem de
 * `GET /disciplinas` e o salvar/remover chamam POST/PATCH/DELETE. A unicidade do
 * código é decidida pelo servidor (409) — a tela traduz a resposta em toast.
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
import { Disciplina, TipoSala } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/**
 * Tipos de sala que uma disciplina pode exigir — código do domínio + rótulo
 * humano. O `null` (sem exigência) é tratado à parte como "Comum".
 */
const TIPOS_SALA = [
  { valor: 'COMUM', rotulo: 'Comum' },
  { valor: 'LABORATORIO', rotulo: 'Laboratório' },
  { valor: 'AUDITORIO', rotulo: 'Auditório' },
  { valor: 'QUADRA', rotulo: 'Quadra' },
] as const;

/** Valor do select que representa "sem exigência" — mapeado para null ao salvar. */
const SEM_EXIGENCIA = '';

/** O rascunho do formulário — os campos editáveis de uma disciplina. */
interface RascunhoDisciplina {
  codigo: string;
  nome: string;
  cargaHoraria: number | null;
  tipoSalaRequerido: TipoSala | '';
}

const RASCUNHO_VAZIO: RascunhoDisciplina = {
  codigo: '',
  nome: '',
  cargaHoraria: null,
  tipoSalaRequerido: '',
};

@Component({
  selector: 'app-disciplinas',
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
  templateUrl: './disciplinas.html',
})
export class DisciplinasComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly tiposSala = TIPOS_SALA;
  readonly semExigencia = SEM_EXIGENCIA;

  readonly disciplinas = signal<Disciplina[]>([]);
  /** true enquanto o salvar/remover está em voo — trava os botões do diálogo. */
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Código', largura: 'w-32' },
    { rotulo: 'Nome' },
    { rotulo: 'Carga horária', alinhamento: 'fim', largura: 'w-36' },
    { rotulo: 'Tipo de sala', largura: 'w-40' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Disciplina>[] = [
    { chave: 'tipoSala', rotulo: 'Tipo de sala', valor: (d) => this.rotuloTipoSala(d.tipoSalaRequerido) },
  ];

  readonly textoBusca = (d: Disciplina): string => `${d.codigo} ${d.nome}`;

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.api.listarDisciplinas().subscribe({
      next: (disciplinas) => this.disciplinas.set(disciplinas),
      error: (err) =>
        this.toast.erro('Falha ao carregar disciplinas', mensagemErro(err, 'Tente novamente.')),
    });
  }

  // Arrow field: além de rotular a coluna, serve de `itemToString` do
  // hlm-select — o trigger deriva o texto do VALOR selecionado, não do conteúdo
  // do item. null/'' (sem exigência) aparece como "Comum".
  readonly rotuloTipoSala = (valor: string | null): string => {
    if (!valor) return 'Comum';
    return TIPOS_SALA.find((t) => t.valor === valor)?.rotulo ?? valor;
  };

  /** Carga em horas de 60 min — formata sem casas decimais quando é inteira. */
  cargaFormatada(horas: number): string {
    return `${Number.isInteger(horas) ? horas : horas.toFixed(2)} h`;
  }

  // ---- Diálogo de formulário --------------------------------------------

  /** Disciplina em edição, ou `null` quando o diálogo está criando uma nova. */
  readonly editando = signal<Disciplina | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoDisciplina>(RASCUNHO_VAZIO);

  readonly removendo = signal<Disciplina | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar disciplina' : 'Nova disciplina',
  );

  atualizar<K extends keyof RascunhoDisciplina>(campo: K, valor: RascunhoDisciplina[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(disciplina: Disciplina): void {
    this.editando.set(disciplina);
    this.rascunho.set({
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      cargaHoraria: disciplina.cargaHoraria,
      tipoSalaRequerido: disciplina.tipoSalaRequerido ?? '',
    });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const codigo = r.codigo.trim().toUpperCase();
    const nome = r.nome.trim();
    if (!codigo || !nome) {
      this.toast.erro('Preencha os campos obrigatórios', 'Código e nome são obrigatórios.');
      return;
    }
    if (r.cargaHoraria == null || r.cargaHoraria <= 0) {
      this.toast.erro('Carga horária inválida', 'Informe a carga horária em horas (maior que zero).');
      return;
    }

    // "Sem exigência" vira null — a coluna nullable distingue "sala comum"
    // (null) de um tipo específico exigido.
    const dados = {
      codigo,
      nome,
      cargaHoraria: r.cargaHoraria,
      tipoSalaRequerido: r.tipoSalaRequerido || null,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarDisciplina(alvo.id, dados)
      : this.api.criarDisciplina(dados);

    requisicao.subscribe({
      next: (disciplina) => {
        this.disciplinas.update((lista) =>
          alvo ? lista.map((d) => (d.id === disciplina.id ? disciplina : d)) : [...lista, disciplina],
        );
        this.toast.sucesso(`${disciplina.codigo} ${alvo ? 'atualizada' : 'cadastrada'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar a disciplina.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(disciplina: Disciplina): void {
    this.removendo.set(disciplina);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerDisciplina(alvo.id).subscribe({
      next: () => {
        this.disciplinas.update((lista) => lista.filter((d) => d.id !== alvo.id));
        this.toast.sucesso(`${alvo.codigo} removida`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro('Falha ao remover', mensagemErro(err, 'Não foi possível remover a disciplina.'));
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
