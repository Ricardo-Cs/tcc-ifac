import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarOff, lucideTrash2 } from '@ng-icons/lucide';
import { forkJoin } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AcademicoApi } from '../../core/api/academico-api';
import { mensagemErro } from '../../core/api/erro-http';
import { GradeApi } from '../../core/api/grade-api';
import { RestricoesApi } from '../../core/api/restricoes-api';
import { ColetaRestricao, RestricaoProfessor } from '../../core/models/disponibilidade.models';
import { Slot } from '../../core/models/grade.models';
import { Professor } from '../../core/models/academico.models';
import { PeriodoState } from '../../core/state/periodo-state';
import { ToastService } from '../../core/toast';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

const DIAS = [
  { num: 1, nome: 'Segunda' },
  { num: 2, nome: 'Terça' },
  { num: 3, nome: 'Quarta' },
  { num: 4, nome: 'Quinta' },
  { num: 5, nome: 'Sexta' },
  { num: 6, nome: 'Sábado' },
];

const TURNO_RANK: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };

interface LinhaGrid {
  turno: string;
  ordem: number;
  horaInicio: string;
  horaFim: string;
  porDia: Map<number, Slot>;
}

interface RascunhoRestricao {
  professorId: string;
  slotIds: string[];
  motivo: string;
  amparoLegal: boolean;
}

const RASCUNHO_VAZIO: RascunhoRestricao = {
  professorId: '',
  slotIds: [],
  motivo: '',
  amparoLegal: false,
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

@Component({
  selector: 'app-disponibilidades',
  imports: [
    FormsModule,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmInput,
    FormDialogComponent,
    ConfirmDialogComponent,
    ListagemComponent,
    ListagemLinhaDirective,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideCalendarOff, lucideTrash2 })],
  templateUrl: './disponibilidades.html',
})
export class DisponibilidadesComponent {
  private readonly api = inject(RestricoesApi);
  private readonly academico = inject(AcademicoApi);
  private readonly gradeApi = inject(GradeApi);
  private readonly toast = inject(ToastService);
  readonly periodoState = inject(PeriodoState);

  readonly dias = DIAS;
  readonly formatarDataHora = formatarDataHora;

  readonly periodoId = computed(() => this.periodoState.selecionado()?.id ?? null);

  readonly coleta = signal<ColetaRestricao | null>(null);
  readonly carregandoColeta = signal(false);
  readonly abrindoColeta = signal(false);
  readonly fechandoColeta = signal(false);
  readonly confirmandoFechamento = signal(false);

  readonly restricoes = signal<RestricaoProfessor[]>([]);
  readonly professores = signal<Professor[]>([]);
  readonly slots = signal<Slot[]>([]);

  readonly linhasGrid = computed<LinhaGrid[]>(() => {
    const porChave = new Map<string, LinhaGrid>();
    for (const slot of this.slots()) {
      const chave = `${slot.turno}-${slot.ordem}`;
      if (!porChave.has(chave)) {
        porChave.set(chave, {
          turno: slot.turno,
          ordem: slot.ordem,
          horaInicio: slot.horaInicio,
          horaFim: slot.horaFim,
          porDia: new Map(),
        });
      }
      porChave.get(chave)!.porDia.set(slot.diaSemana, slot);
    }
    return [...porChave.values()].sort(
      (a, b) => (TURNO_RANK[a.turno] ?? 0) - (TURNO_RANK[b.turno] ?? 0) || a.ordem - b.ordem,
    );
  });

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Professor' },
    { rotulo: 'Horário', largura: 'w-32' },
    { rotulo: 'Amparo legal', largura: 'w-32', alinhamento: 'centro' },
    { rotulo: 'Motivo' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-16' },
  ];

  readonly filtros: FiltroListagem<RestricaoProfessor>[] = [
    {
      chave: 'amparoLegal',
      rotulo: 'Amparo legal',
      valor: (r) => (r.amparoLegal ? 'Sim' : 'Não'),
    },
  ];

  readonly textoBusca = (r: RestricaoProfessor): string =>
    `${r.professorNome} ${r.slotHorarioCodigo} ${r.motivo ?? ''}`;

  readonly rotuloProfessor = (id: string): string =>
    this.professores().find((p) => p.id === id)?.nome ?? id;

  constructor() {
    this.academico.listarProfessores().subscribe({
      next: (professores) => this.professores.set(professores),
      error: (err) =>
        this.toast.erro('Falha ao carregar professores', mensagemErro(err, 'Tente novamente.')),
    });

    effect(() => {
      const id = this.periodoId();
      if (id) this.carregar(id);
    });
  }

  private carregar(periodoId: string): void {
    this.dialogAberto.set(false);
    this.removendo.set(null);
    this.confirmandoFechamento.set(false);

    this.gradeApi.grade(periodoId).subscribe({
      next: (grade) => this.slots.set(grade.slots),
      error: (err) =>
        this.toast.erro('Falha ao carregar os horários', mensagemErro(err, 'Tente novamente.')),
    });

    this.carregandoColeta.set(true);
    this.api.coletaPorPeriodo(periodoId).subscribe({
      next: (coleta) => {
        this.coleta.set(coleta);
        this.carregandoColeta.set(false);
        this.carregarRestricoes(periodoId);
      },
      error: (err) => {
        this.carregandoColeta.set(false);
        this.coleta.set(null);
        this.restricoes.set([]);
        if (err.status !== 404) {
          this.toast.erro('Falha ao carregar a coleta', mensagemErro(err, 'Tente novamente.'));
        }
      },
    });
  }

  private carregarRestricoes(periodoId: string): void {
    this.api.listarRestricoes(periodoId).subscribe({
      next: (lista) => this.restricoes.set(lista),
      error: (err) =>
        this.toast.erro('Falha ao carregar restrições', mensagemErro(err, 'Tente novamente.')),
    });
  }

  abrirColeta(): void {
    const periodoId = this.periodoId();
    if (!periodoId) return;
    this.abrindoColeta.set(true);
    this.api.abrirColeta(periodoId).subscribe({
      next: (coleta) => {
        this.coleta.set(coleta);
        this.abrindoColeta.set(false);
        this.toast.sucesso('Coleta de restrições aberta.');
      },
      error: (err) => {
        this.abrindoColeta.set(false);
        this.toast.erro('Falha ao abrir a coleta', mensagemErro(err, 'Tente novamente.'));
      },
    });
  }

  pedirFechamento(): void {
    this.confirmandoFechamento.set(true);
  }

  cancelarFechamento(): void {
    this.confirmandoFechamento.set(false);
  }

  confirmarFechamento(): void {
    const coleta = this.coleta();
    if (!coleta) return;
    this.fechandoColeta.set(true);
    this.api.removerColeta(coleta.id).subscribe({
      next: () => {
        this.coleta.set(null);
        this.restricoes.set([]);
        this.fechandoColeta.set(false);
        this.confirmandoFechamento.set(false);
        this.toast.sucesso('Coleta de restrições removida.');
      },
      error: (err) => {
        this.fechandoColeta.set(false);
        this.toast.erro(
          'Falha ao remover a coleta',
          mensagemErro(err, 'Não foi possível remover.'),
        );
      },
    });
  }

  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoRestricao>(RASCUNHO_VAZIO);
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  abrirNovo(): void {
    this.rascunho.set(RASCUNHO_VAZIO);
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  atualizarProfessor(id: string): void {
    this.rascunho.update((r) => ({ ...r, professorId: id }));
  }

  atualizarMotivo(motivo: string): void {
    this.rascunho.update((r) => ({ ...r, motivo }));
  }

  atualizarAmparoLegal(amparoLegal: boolean): void {
    this.rascunho.update((r) => ({ ...r, amparoLegal }));
  }

  alternarSlot(slotId: string): void {
    this.rascunho.update((r) => {
      const jaSelecionado = r.slotIds.includes(slotId);
      return {
        ...r,
        slotIds: jaSelecionado ? r.slotIds.filter((id) => id !== slotId) : [...r.slotIds, slotId],
      };
    });
  }

  salvar(): void {
    const r = this.rascunho();
    const periodoId = this.periodoId();
    if (!periodoId) return;
    if (!r.professorId) {
      this.erroForm.set('Selecione o professor.');
      return;
    }
    if (r.slotIds.length === 0) {
      this.erroForm.set('Selecione ao menos um horário.');
      return;
    }
    if (!r.motivo.trim()) {
      this.erroForm.set('Informe o motivo da restrição.');
      return;
    }
    this.erroForm.set(null);
    this.salvando.set(true);

    const requisicoes = r.slotIds.map((slotId) =>
      this.api.criarRestricao({
        professorId: r.professorId,
        slotHorarioId: slotId,
        periodoLetivoId: periodoId,
        motivo: r.motivo.trim(),
        amparoLegal: r.amparoLegal,
      }),
    );

    forkJoin(requisicoes).subscribe({
      next: (criadas) => {
        this.restricoes.update((lista) => [...lista, ...criadas]);
        this.toast.sucesso(`${criadas.length} restrição(ões) lançada(s).`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.erroForm.set(mensagemErro(err, 'Não foi possível lançar a(s) restrição(ões).'));
        this.salvando.set(false);
        this.carregarRestricoes(periodoId);
      },
    });
  }

  readonly removendo = signal<RestricaoProfessor | null>(null);

  pedirRemocao(restricao: RestricaoProfessor): void {
    this.removendo.set(restricao);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerRestricao(alvo.id).subscribe({
      next: () => {
        this.restricoes.update((lista) => lista.filter((r) => r.id !== alvo.id));
        this.toast.sucesso('Restrição removida.');
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover a restrição.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
