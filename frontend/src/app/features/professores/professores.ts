import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLoaderCircle,
  lucidePencil,
  lucideTrash2,
  lucideUpload,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AcademicoApi } from '../../core/api/academico-api';
import { mensagemErro } from '../../core/api/erro-http';
import { formatarHoras } from '../../core/format/horas';
import {
  AcaoImportacaoProfessor,
  GrupoRegime,
  PreviaImportacaoProfessores,
  Professor,
  ResultadoImportacaoProfessores,
} from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

const REGIMES = [
  { valor: 'G1', rotulo: 'G1' },
  { valor: 'G2', rotulo: 'G2' },
  { valor: 'G3_20H', rotulo: 'G3 (20h)' },
  { valor: 'G3_40H', rotulo: 'G3 (40h)' },
  { valor: 'G2_1', rotulo: 'G2.1' },
  { valor: 'G2_2', rotulo: 'G2.2' },
  { valor: 'G2_3', rotulo: 'G2.3' },
] as const;

interface RascunhoProfessor {
  nome: string;
  identificador: string;
  email: string;
  titulacao: string;
  grupoRegime: GrupoRegime | '';
}

const RASCUNHO_VAZIO: RascunhoProfessor = {
  nome: '',
  identificador: '',
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
    FormDialogComponent,
    ConfirmDialogComponent,
    ListagemComponent,
    ListagemLinhaDirective,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({ lucideLoaderCircle, lucidePencil, lucideTrash2, lucideUpload, lucideUsers }),
  ],
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
    { rotulo: 'Identificador', largura: 'w-40' },
    { rotulo: 'Regime', largura: 'w-40' },
    { rotulo: 'Carga atual', largura: 'w-32' },
    { rotulo: 'Status', largura: 'w-32' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-28' },
  ];

  readonly filtros: FiltroListagem<Professor>[] = [
    { chave: 'regime', rotulo: 'Regime', valor: (p) => this.rotuloRegime(p.grupoRegime) },
  ];

  readonly textoBusca = (p: Professor): string => `${p.nome} ${p.identificador}`;

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

  readonly rotuloRegime = (valor: string | null): string =>
    valor ? (REGIMES.find((r) => r.valor === valor)?.rotulo ?? valor) : 'Não informado';

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  cargaFormatada(horas: number | undefined): string {
    return formatarHoras(horas ?? 0);
  }

  readonly editando = signal<Professor | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoProfessor>(RASCUNHO_VAZIO);
  readonly erroForm = signal<string | null>(null);

  readonly removendo = signal<Professor | null>(null);

  readonly tituloDialog = computed(() => (this.editando() ? 'Editar professor' : 'Novo professor'));

  atualizar<K extends keyof RascunhoProfessor>(campo: K, valor: RascunhoProfessor[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  readonly importarAberto = signal(false);
  readonly importando = signal(false);
  readonly arquivoImportar = signal<File | null>(null);
  readonly erroImportar = signal<string | null>(null);
  readonly resultadoImportar = signal<ResultadoImportacaoProfessores | null>(null);
  readonly carregandoPrevia = signal(false);
  readonly previaImportar = signal<PreviaImportacaoProfessores | null>(null);

  abrirImportar(): void {
    this.arquivoImportar.set(null);
    this.erroImportar.set(null);
    this.resultadoImportar.set(null);
    this.previaImportar.set(null);
    this.importarAberto.set(true);
  }

  fecharImportar(): void {
    this.importarAberto.set(false);
  }

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    this.arquivoImportar.set(arquivo);
    this.erroImportar.set(null);
    this.resultadoImportar.set(null);
    this.previaImportar.set(null);

    if (!arquivo) return;

    this.carregandoPrevia.set(true);
    this.api.previaImportarProfessores(arquivo).subscribe({
      next: (previa) => {
        this.carregandoPrevia.set(false);
        this.previaImportar.set(previa);
      },
      error: (err) => {
        this.carregandoPrevia.set(false);
        this.erroImportar.set(mensagemErro(err, 'Não foi possível ler o arquivo.'));
      },
    });
  }

  contarAcao(previa: PreviaImportacaoProfessores, acao: AcaoImportacaoProfessor): number {
    return previa.linhas.filter((l) => l.acao === acao).length;
  }

  confirmarImportar(): void {
    const arquivo = this.arquivoImportar();
    if (!arquivo) {
      this.erroImportar.set('Selecione um arquivo CSV ou XLSX.');
      return;
    }
    this.erroImportar.set(null);
    this.importando.set(true);

    this.api.importarProfessores(arquivo).subscribe({
      next: (resultado) => {
        this.importando.set(false);
        this.resultadoImportar.set(resultado);
        this.previaImportar.set(null);
        this.carregar();
        if (resultado.erros.length === 0) {
          this.toast.sucesso(
            `${resultado.criados} criado(s), ${resultado.atualizados} atualizado(s)`,
          );
          this.fecharImportar();
        } else {
          this.toast.aviso(
            `${resultado.erros.length} linha(s) com erro`,
            `${resultado.criados} criado(s), ${resultado.atualizados} atualizado(s)`,
          );
        }
      },
      error: (err) => {
        this.importando.set(false);
        this.erroImportar.set(mensagemErro(err, 'Não foi possível importar o arquivo.'));
      },
    });
  }

  editar(professor: Professor): void {
    this.editando.set(professor);
    this.rascunho.set({
      nome: professor.nome,
      identificador: professor.identificador,
      email: professor.email ?? '',
      titulacao: professor.titulacao ?? '',
      grupoRegime: professor.grupoRegime ?? '',
    });
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    const identificador = r.identificador.trim();
    if (!nome || !identificador) {
      this.erroForm.set('Nome e identificador são obrigatórios.');
      return;
    }
    this.erroForm.set(null);

    const dados = {
      nome,
      identificador,
      email: r.email.trim() || null,
      titulacao: r.titulacao.trim() || null,
      grupoRegime: r.grupoRegime || null,
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
        this.erroForm.set(mensagemErro(err, 'Não foi possível salvar o professor.'));
        this.salvando.set(false);
      },
    });
  }

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
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover o professor.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
