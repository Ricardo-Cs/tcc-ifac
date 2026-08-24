import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayers, lucidePencil, lucidePlus, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AcademicoApi } from '../../core/api/academico-api';
import { mensagemErro } from '../../core/api/erro-http';
import {
  CriarOferta,
  Disciplina,
  Oferta,
  Professor,
  RegimeOferta,
  Turma,
} from '../../core/models/academico.models';
import { PeriodoState } from '../../core/state/periodo-state';
import { ToastService } from '../../core/toast';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';
import { SugestaoAulasSemana, sugerirAulasSemana } from './carga';

const REGIMES = [
  { valor: 'SEMESTRAL', rotulo: 'Semestral' },
  { valor: 'ANUAL', rotulo: 'Anual' },
] as const;

interface RascunhoVinculo {
  professorId: string;
  proporcaoCarga: number | null;
}

interface RascunhoOferta {
  turmaId: string;
  disciplinaId: string;
  regime: RegimeOferta | '';
  aulasSemana: number | null;
  observacoes: string;
  professores: RascunhoVinculo[];
}

const vinculoVazio = (): RascunhoVinculo => ({
  professorId: '',
  proporcaoCarga: null,
});

const rascunhoVazio = (): RascunhoOferta => ({
  turmaId: '',
  disciplinaId: '',
  regime: '',
  aulasSemana: null,
  observacoes: '',
  professores: [vinculoVazio()],
});

@Component({
  selector: 'app-ofertas',
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
  providers: [provideIcons({ lucideLayers, lucidePencil, lucideTrash2, lucidePlus, lucideX })],
  templateUrl: './ofertas.html',
})
export class OfertasComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);
  readonly periodoState = inject(PeriodoState);

  readonly regimes = REGIMES;

  readonly ofertas = signal<Oferta[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly disciplinas = signal<Disciplina[]>([]);
  readonly professores = signal<Professor[]>([]);
  readonly salvando = signal(false);

  readonly editavel = this.periodoState.editavel;

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Turma', largura: 'w-40' },
    { rotulo: 'Disciplina' },
    { rotulo: 'Regime', largura: 'w-32' },
    { rotulo: 'Aulas/sem', largura: 'w-28' },
    { rotulo: 'Professores' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Oferta>[] = [
    { chave: 'curso', rotulo: 'Curso', valor: (o) => o.cursoSigla },
    {
      chave: 'regime',
      rotulo: 'Regime',
      valor: (o) => this.rotuloRegime(o.regime),
    },
  ];

  readonly textoBusca = (o: Oferta): string =>
    `${o.cursoSigla} ${o.turmaNome} ${o.disciplinaCodigo} ${o.disciplinaNome}`;

  constructor() {
    this.carregarAuxiliares();
    effect(() => {
      const periodo = this.periodoState.selecionado();
      if (periodo) {
        this.carregarOfertas(periodo.id);
      } else {
        this.ofertas.set([]);
      }
    });
  }

  private carregarOfertas(periodoLetivoId: string): void {
    this.api.listarOfertas(periodoLetivoId).subscribe({
      next: (ofertas) => this.ofertas.set(ofertas),
      error: (err) =>
        this.toast.erro('Falha ao carregar ofertas', mensagemErro(err, 'Tente novamente.')),
    });
  }

  private carregarAuxiliares(): void {
    this.api.listarTurmas().subscribe({
      next: (t) => this.turmas.set(t),
      error: () => this.turmas.set([]),
    });
    this.api.listarDisciplinas().subscribe({
      next: (d) => this.disciplinas.set(d),
      error: () => this.disciplinas.set([]),
    });
    this.api.listarProfessores().subscribe({
      next: (p) => this.professores.set(p),
      error: () => this.professores.set([]),
    });
  }

  readonly rotuloRegime = (valor: string): string =>
    REGIMES.find((r) => r.valor === valor)?.rotulo ?? valor;

  readonly rotuloTurma = (turmaId: string): string => {
    const t = this.turmas().find((x) => x.id === turmaId);
    return t ? `${t.cursoSigla} — ${t.nome}` : turmaId;
  };

  readonly rotuloDisciplina = (disciplinaId: string): string => {
    const d = this.disciplinas().find((x) => x.id === disciplinaId);
    return d ? `${d.codigo} — ${d.nome}` : disciplinaId;
  };

  readonly rotuloProfessor = (professorId: string): string =>
    this.professores().find((x) => x.id === professorId)?.nome ?? professorId;

  resumoProfessores(o: Oferta): string {
    if (o.professores.length === 0) return '—';
    if (o.professores.length === 1) return o.professores[0].professorNome;
    return o.professores.map((p) => `${p.professorNome} (${p.proporcaoCarga}%)`).join(', ');
  }

  readonly editando = signal<Oferta | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoOferta>(rascunhoVazio());
  readonly erroForm = signal<string | null>(null);

  readonly aulasSemanaEditado = signal(false);

  readonly removendo = signal<Oferta | null>(null);

  readonly tituloDialog = computed(() => (this.editando() ? 'Editar oferta' : 'Nova oferta'));

  readonly codocencia = computed(() => this.rascunho().professores.length > 1);

  readonly somaProporcoes = computed(() =>
    this.rascunho().professores.reduce((s, p) => s + (p.proporcaoCarga ?? 0), 0),
  );

  readonly turmaEscolhida = computed<Turma | null>(
    () => this.turmas().find((t) => t.id === this.rascunho().turmaId) ?? null,
  );

  readonly disciplinasDoCurso = computed<Disciplina[]>(() => {
    const turma = this.turmaEscolhida();
    if (!turma) return [];
    return this.disciplinas().filter((d) => d.cursoId === turma.cursoId);
  });

  readonly cargaHorariaEscolhida = computed<number | null>(
    () =>
      this.disciplinas().find((d) => d.id === this.rascunho().disciplinaId)?.cargaHoraria ?? null,
  );

  readonly sugestao = computed<SugestaoAulasSemana | null>(() =>
    sugerirAulasSemana(this.cargaHorariaEscolhida(), this.rascunho().regime),
  );

  readonly divergeDaSugestao = computed(() => {
    const sugestao = this.sugestao();
    const atual = this.rascunho().aulasSemana;
    return sugestao !== null && atual !== null && atual !== sugestao.aulasSemana;
  });

  numero(valor: number): string {
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  usarSugestao(): void {
    const sugestao = this.sugestao();
    if (!sugestao) return;
    this.aulasSemanaEditado.set(false);
    this.rascunho.update((r) => ({ ...r, aulasSemana: sugestao.aulasSemana }));
  }

  atualizar<K extends keyof RascunhoOferta>(campo: K, valor: RascunhoOferta[K]): void {
    if (campo === 'aulasSemana') this.aulasSemanaEditado.set(valor != null);

    this.rascunho.update((r) => {
      const proximo = { ...r, [campo]: valor };

      if (campo === 'turmaId') {
        const curso = this.turmas().find((t) => t.id === proximo.turmaId)?.cursoId;
        const disciplina = this.disciplinas().find((d) => d.id === proximo.disciplinaId);
        if (disciplina && disciplina.cursoId !== curso) {
          proximo.disciplinaId = '';
        }
      }

      if (campo === 'disciplinaId' || campo === 'regime') {
        const sugestao = sugerirAulasSemana(
          this.disciplinas().find((d) => d.id === proximo.disciplinaId)?.cargaHoraria ?? null,
          proximo.regime,
        );
        if (sugestao && !this.aulasSemanaEditado()) {
          proximo.aulasSemana = sugestao.aulasSemana;
        }
      }
      return proximo;
    });
  }

  adicionarProfessor(): void {
    this.rascunho.update((r) => ({
      ...r,
      professores: [...r.professores, vinculoVazio()],
    }));
  }

  removerProfessor(indice: number): void {
    this.rascunho.update((r) => ({
      ...r,
      professores: r.professores.filter((_, i) => i !== indice),
    }));
  }

  atualizarProfessor<K extends keyof RascunhoVinculo>(
    indice: number,
    campo: K,
    valor: RascunhoVinculo[K],
  ): void {
    this.rascunho.update((r) => ({
      ...r,
      professores: r.professores.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)),
    }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(rascunhoVazio());
    this.aulasSemanaEditado.set(false);
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  editar(oferta: Oferta): void {
    this.editando.set(oferta);
    this.rascunho.set({
      turmaId: oferta.turmaId,
      disciplinaId: oferta.disciplinaId,
      regime: oferta.regime,
      aulasSemana: oferta.aulasSemana,
      observacoes: oferta.observacoes ?? '',
      professores: oferta.professores.map((p) => ({
        professorId: p.professorId,
        proporcaoCarga: p.proporcaoCarga,
      })),
    });
    this.aulasSemanaEditado.set(true);
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const periodo = this.periodoState.selecionado();
    if (!periodo) {
      this.erroForm.set('Selecione um período letivo.');
      return;
    }
    const r = this.rascunho();
    if (!r.turmaId || !r.disciplinaId || !r.regime) {
      this.erroForm.set('Turma, disciplina e regime são obrigatórios.');
      return;
    }
    if (r.aulasSemana == null || r.aulasSemana < 1) {
      this.erroForm.set('Informe as aulas por semana (valor ≥ 1).');
      return;
    }

    const professores = r.professores
      .filter((p) => p.professorId)
      .map((p) => ({
        professorId: p.professorId,
        proporcaoCarga: p.proporcaoCarga ?? 0,
      }));
    if (professores.length === 0) {
      this.erroForm.set('A oferta precisa de pelo menos um docente.');
      return;
    }
    if (professores.length === 1) {
      professores[0].proporcaoCarga = 100;
    } else {
      const soma = professores.reduce((s, p) => s + p.proporcaoCarga, 0);
      if (Math.round(soma * 100) / 100 !== 100) {
        this.erroForm.set(`As proporções de carga devem somar 100% (soma atual: ${soma}%).`);
        return;
      }
    }
    this.erroForm.set(null);

    const dados: CriarOferta = {
      turmaId: r.turmaId,
      disciplinaId: r.disciplinaId,
      periodoLetivoId: periodo.id,
      regime: r.regime,
      aulasSemana: r.aulasSemana,
      observacoes: r.observacoes.trim() || null,
      professores,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarOferta(alvo.id, dados)
      : this.api.criarOferta(dados);

    requisicao.subscribe({
      next: (oferta) => {
        this.ofertas.update((lista) =>
          alvo ? lista.map((o) => (o.id === oferta.id ? oferta : o)) : [...lista, oferta],
        );
        this.toast.sucesso(
          `Oferta ${alvo ? 'atualizada' : 'cadastrada'}`,
          `${oferta.turmaNome} · ${oferta.disciplinaCodigo}`,
        );
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.erroForm.set(mensagemErro(err, 'Não foi possível salvar a oferta.'));
        this.salvando.set(false);
      },
    });
  }

  pedirRemocao(oferta: Oferta): void {
    this.removendo.set(oferta);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerOferta(alvo.id).subscribe({
      next: () => {
        this.ofertas.update((lista) => lista.filter((o) => o.id !== alvo.id));
        this.toast.sucesso('Oferta removida');
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover a oferta.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
