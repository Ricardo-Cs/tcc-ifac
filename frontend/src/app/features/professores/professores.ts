/**
 * Cadastro de Professores — segue o molde de Cursos (listagem + diálogo de
 * formulário), agora integrado ao backend (`ProfessoresController`): a lista vem
 * de `GET /professores` e o salvar/remover chamam POST/PATCH/DELETE. A unicidade
 * do SIAPE é decidida pelo servidor (409) — a tela traduz a resposta em toast.
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
import { GrupoRegime, Professor } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** Grupos de regime (RAD) — código do domínio + rótulo humano para exibir/filtrar. */
const REGIMES = [
  { valor: 'G1', rotulo: 'G1' },
  { valor: 'G2', rotulo: 'G2' },
  { valor: 'G3_20H', rotulo: 'G3 (20h)' },
  { valor: 'G3_40H', rotulo: 'G3 (40h)' },
  { valor: 'G2_1', rotulo: 'G2.1' },
  { valor: 'G2_2', rotulo: 'G2.2' },
  { valor: 'G2_3', rotulo: 'G2.3' },
] as const;

/** O rascunho do formulário — os campos editáveis de um professor. */
interface RascunhoProfessor {
  nome: string;
  siape: string;
  email: string;
  titulacao: string;
  grupoRegime: GrupoRegime | '';
}

const RASCUNHO_VAZIO: RascunhoProfessor = {
  nome: '',
  siape: '',
  email: '',
  titulacao: '',
  grupoRegime: '',
};

@Component({
  selector: 'app-professores',
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
  templateUrl: './professores.html',
})
export class ProfessoresComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly regimes = REGIMES;

  readonly professores = signal<Professor[]>([]);
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Nome' },
    { rotulo: 'SIAPE', largura: 'w-40' },
    { rotulo: 'Regime', largura: 'w-40' },
    { rotulo: 'Status', largura: 'w-32' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-28' },
  ];

  /** Regime é faceta: rótulo humano, deduzido dos próprios dados. */
  readonly filtros: FiltroListagem<Professor>[] = [
    { chave: 'regime', rotulo: 'Regime', valor: (p) => this.rotuloRegime(p.grupoRegime) },
  ];

  /** Só nome e SIAPE fazem sentido na busca — regime/status são filtros de faceta. */
  readonly textoBusca = (p: Professor): string => `${p.nome} ${p.siape}`;

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.api.listarProfessores().subscribe({
      next: (professores) => this.professores.set(professores),
      error: (err) =>
        this.toast.erro('Falha ao carregar professores', mensagemErro(err, 'Tente novamente.')),
    });
  }

  // Arrow field para servir de `itemToString` do hlm-select: o trigger deriva
  // seu texto do VALOR selecionado, não do conteúdo do item — sem isto mostraria
  // o código cru (ex.: "G3_40H").
  readonly rotuloRegime = (valor: string): string =>
    REGIMES.find((r) => r.valor === valor)?.rotulo ?? valor;

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  // ---- Diálogo de formulário --------------------------------------------

  readonly editando = signal<Professor | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoProfessor>(RASCUNHO_VAZIO);

  readonly removendo = signal<Professor | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar professor' : 'Novo professor',
  );

  atualizar<K extends keyof RascunhoProfessor>(campo: K, valor: RascunhoProfessor[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(professor: Professor): void {
    this.editando.set(professor);
    this.rascunho.set({
      nome: professor.nome,
      siape: professor.siape,
      email: professor.email ?? '',
      titulacao: professor.titulacao ?? '',
      grupoRegime: professor.grupoRegime,
    });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    const siape = r.siape.trim();
    if (!nome || !siape || !r.grupoRegime) {
      this.toast.erro('Preencha os campos obrigatórios', 'Nome, SIAPE e regime são obrigatórios.');
      return;
    }
    if (!/^\d{7,8}$/.test(siape)) {
      this.toast.erro('SIAPE inválido', 'O SIAPE deve ter 7 ou 8 dígitos.');
      return;
    }

    // Campos opcionais viram null quando vazios — o backend distingue ausente de
    // string vazia, e null é o "sem valor" que a coluna nullable espera.
    const dados = {
      nome,
      siape,
      email: r.email.trim() || null,
      titulacao: r.titulacao.trim() || null,
      grupoRegime: r.grupoRegime,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarProfessor(alvo.id, dados)
      : this.api.criarProfessor(dados);

    requisicao.subscribe({
      next: (professor) => {
        this.professores.update((lista) =>
          alvo ? lista.map((p) => (p.id === professor.id ? professor : p)) : [...lista, professor],
        );
        this.toast.sucesso(`${professor.nome} ${alvo ? 'atualizado' : 'cadastrado'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar o professor.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(professor: Professor): void {
    this.removendo.set(professor);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerProfessor(alvo.id).subscribe({
      next: () => {
        this.professores.update((lista) => lista.filter((p) => p.id !== alvo.id));
        this.toast.sucesso(`${alvo.nome} removido`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro('Falha ao remover', mensagemErro(err, 'Não foi possível remover o professor.'));
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
