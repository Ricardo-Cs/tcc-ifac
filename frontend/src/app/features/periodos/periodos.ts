import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarRange, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { GradeApi } from '../../core/api/grade-api';
import { mensagemErro } from '../../core/api/erro-http';
import { PeriodosApi } from '../../core/api/periodos-api';
import { Periodo, StatusPeriodo } from '../../core/models/grade.models';
import { ToastService } from '../../core/toast';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

const STATUS = [
  { valor: 'RASCUNHO', rotulo: 'Rascunho' },
  { valor: 'VALIDADO', rotulo: 'Validado' },
  { valor: 'PUBLICADO', rotulo: 'Publicado' },
] as const;

interface RascunhoPeriodo {
  ano: number | null;
  semestre: number | null;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: StatusPeriodo | '';
  ativo: boolean;
}

const RASCUNHO_VAZIO: RascunhoPeriodo = {
  ano: null,
  semestre: null,
  descricao: '',
  dataInicio: '',
  dataFim: '',
  status: 'RASCUNHO',
  ativo: false,
};

function formatarData(iso: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mascararData(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter((p) => p);
  return partes.join('/');
}

function paraIso(exibicao: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(exibicao);
  if (!m) return '';
  const [, dia, mes, ano] = m;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const valido =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia);
  return valido ? `${ano}-${mes}-${dia}` : '';
}

@Component({
  selector: 'app-periodos',
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
  providers: [provideIcons({ lucideCalendarRange, lucidePencil, lucideTrash2 })],
  templateUrl: './periodos.html',
})
export class PeriodosComponent {
  private readonly gradeApi = inject(GradeApi);
  private readonly api = inject(PeriodosApi);
  private readonly toast = inject(ToastService);

  readonly statusOpcoes = STATUS;
  readonly formatarData = formatarData;

  readonly periodos = signal<Periodo[]>([]);
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Código', largura: 'w-24' },
    { rotulo: 'Descrição' },
    { rotulo: 'Vigência', largura: 'w-44' },
    { rotulo: 'Status', largura: 'w-32' },
    { rotulo: 'Corrente', largura: 'w-24' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Periodo>[] = [
    { chave: 'status', rotulo: 'Status', valor: (p) => this.rotuloStatus(p.status) },
  ];

  readonly textoBusca = (p: Periodo): string => `${p.codigo} ${p.descricao ?? ''}`;

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.gradeApi.periodos().subscribe({
      next: (periodos) => this.periodos.set(periodos),
      error: (err) =>
        this.toast.erro('Falha ao carregar períodos', mensagemErro(err, 'Tente novamente.')),
    });
  }

  readonly editando = signal<Periodo | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoPeriodo>(RASCUNHO_VAZIO);
  readonly erroForm = signal<string | null>(null);

  readonly dataInicioTexto = signal('');
  readonly dataFimTexto = signal('');

  readonly removendo = signal<Periodo | null>(null);

  readonly tituloDialog = computed(() => (this.editando() ? 'Editar período' : 'Novo período'));

  readonly rotuloStatus = (valor: string): string =>
    STATUS.find((s) => s.valor === valor)?.rotulo ?? valor;

  atualizar<K extends keyof RascunhoPeriodo>(campo: K, valor: RascunhoPeriodo[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  digitarData(campo: 'dataInicio' | 'dataFim', valor: string): void {
    const mascarada = mascararData(valor);
    (campo === 'dataInicio' ? this.dataInicioTexto : this.dataFimTexto).set(mascarada);
    this.atualizar(campo, paraIso(mascarada));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dataInicioTexto.set('');
    this.dataFimTexto.set('');
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  editar(periodo: Periodo): void {
    this.editando.set(periodo);
    const { ano, semestre, descricao, dataInicio, dataFim, status, ativo } = periodo;
    this.rascunho.set({
      ano,
      semestre,
      descricao: descricao ?? '',
      dataInicio,
      dataFim,
      status,
      ativo,
    });
    this.dataInicioTexto.set(formatarData(dataInicio));
    this.dataFimTexto.set(formatarData(dataFim));
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    if (!r.ano || !r.semestre || !r.dataInicio || !r.dataFim || !r.status) {
      this.erroForm.set('Ano, semestre, vigência e status são obrigatórios.');
      return;
    }
    if (r.dataFim < r.dataInicio) {
      this.erroForm.set('A data de fim não pode ser anterior à data de início.');
      return;
    }
    this.erroForm.set(null);

    const dados = {
      ano: r.ano,
      semestre: r.semestre,
      descricao: r.descricao.trim() ? r.descricao.trim() : null,
      dataInicio: r.dataInicio,
      dataFim: r.dataFim,
      status: r.status,
      ativo: r.ativo,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo ? this.api.atualizar(alvo.id, dados) : this.api.criar(dados);

    requisicao.subscribe({
      next: (periodo) => {
        this.carregar();
        this.toast.sucesso(`${periodo.codigo} ${alvo ? 'atualizado' : 'cadastrado'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.erroForm.set(mensagemErro(err, 'Não foi possível salvar o período.'));
        this.salvando.set(false);
      },
    });
  }

  pedirRemocao(periodo: Periodo): void {
    this.removendo.set(periodo);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.remover(alvo.id).subscribe({
      next: () => {
        this.periodos.update((lista) => lista.filter((p) => p.id !== alvo.id));
        this.toast.sucesso(`${alvo.codigo} removido`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover o período.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
