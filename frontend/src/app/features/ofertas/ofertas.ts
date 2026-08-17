/**
 * Cadastro de Ofertas — a oferta liga turma × disciplina × período e carrega a
 * codocência (N professores, cada um com um % de carga que soma 100). Segue o
 * molde de listagem + diálogo, mas com duas diferenças:
 *
 * 1. É recortada por PERÍODO: a lista mostra as ofertas do período em foco
 *    (`PeriodoState`), e só permite criar/editar quando ele é o corrente
 *    (`editavel`). Período passado é somente leitura.
 * 2. O formulário tem linhas dinâmicas de professor+proporção; a soma = 100 é
 *    checada aqui e reforçada pelo servidor (400).
 */
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
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
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** Regimes de oferta — código do domínio + rótulo humano. */
const REGIMES = [
  { valor: 'SEMESTRAL', rotulo: 'Semestral' },
  { valor: 'ANUAL', rotulo: 'Anual' },
] as const;

/** Uma linha de codocência no rascunho do formulário. */
interface RascunhoVinculo {
  professorId: string;
  proporcaoCarga: number | null;
}

/** O rascunho do formulário — os campos editáveis de uma oferta. */
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
    ListagemComponent,
    ListagemLinhaDirective,
    ...HlmSelectImports,
    ...HlmDialogImports,
  ],
  providers: [
    provideIcons({ lucidePencil, lucideTrash2, lucidePlus, lucideX }),
  ],
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
  /** true enquanto o salvar/remover está em voo — trava os botões do diálogo. */
  readonly salvando = signal(false);

  /** O período em foco só aceita edição quando é o corrente. */
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
    // Recorte por período: recarrega as ofertas sempre que o foco muda.
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
        this.toast.erro(
          'Falha ao carregar ofertas',
          mensagemErro(err, 'Tente novamente.'),
        ),
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

  // Arrow fields para os `itemToString` dos selects: derivam o rótulo a partir
  // do id/valor guardado no rascunho.
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

  /** Resumo da codocência para a coluna da listagem. */
  resumoProfessores(o: Oferta): string {
    if (o.professores.length === 0) return '—';
    if (o.professores.length === 1) return o.professores[0].professorNome;
    return o.professores
      .map((p) => `${p.professorNome} (${p.proporcaoCarga}%)`)
      .join(', ');
  }

  // ---- Diálogo de formulário --------------------------------------------

  /** Oferta em edição, ou `null` quando o diálogo está criando uma nova. */
  readonly editando = signal<Oferta | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoOferta>(rascunhoVazio());

  /** Oferta à espera de confirmação de remoção — abre o diálogo de confirmar. */
  readonly removendo = signal<Oferta | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar oferta' : 'Nova oferta',
  );

  readonly codocencia = computed(() => this.rascunho().professores.length > 1);

  /** Soma das proporções digitadas — a UI mostra e trava o salvar em ≠ 100. */
  readonly somaProporcoes = computed(() =>
    this.rascunho().professores.reduce(
      (s, p) => s + (p.proporcaoCarga ?? 0),
      0,
    ),
  );

  atualizar<K extends keyof RascunhoOferta>(
    campo: K,
    valor: RascunhoOferta[K],
  ): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
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
      professores: r.professores.map((p, i) =>
        i === indice ? { ...p, [campo]: valor } : p,
      ),
    }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(rascunhoVazio());
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
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const periodo = this.periodoState.selecionado();
    if (!periodo) {
      this.toast.erro('Nenhum período em foco', 'Selecione um período letivo.');
      return;
    }
    const r = this.rascunho();
    if (!r.turmaId || !r.disciplinaId || !r.regime) {
      this.toast.erro(
        'Preencha os campos obrigatórios',
        'Turma, disciplina e regime são obrigatórios.',
      );
      return;
    }
    if (r.aulasSemana == null || r.aulasSemana < 1) {
      this.toast.erro('Aulas por semana inválido', 'Informe um valor ≥ 1.');
      return;
    }

    const professores = r.professores
      .filter((p) => p.professorId)
      .map((p) => ({
        professorId: p.professorId,
        proporcaoCarga: p.proporcaoCarga ?? 0,
      }));
    if (professores.length === 0) {
      this.toast.erro(
        'Informe ao menos um professor',
        'A oferta precisa de pelo menos um docente.',
      );
      return;
    }
    // Docente único ⇒ 100% implícito (o campo nem aparece na UI). A soma só é
    // exigida na codocência, onde o usuário reparte a carga entre os professores.
    if (professores.length === 1) {
      professores[0].proporcaoCarga = 100;
    } else {
      const soma = professores.reduce((s, p) => s + p.proporcaoCarga, 0);
      if (Math.round(soma * 100) / 100 !== 100) {
        this.toast.erro(
          'Proporções inválidas',
          `As proporções de carga devem somar 100% (soma atual: ${soma}%).`,
        );
        return;
      }
    }

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
          alvo
            ? lista.map((o) => (o.id === oferta.id ? oferta : o))
            : [...lista, oferta],
        );
        this.toast.sucesso(
          `Oferta ${alvo ? 'atualizada' : 'cadastrada'}`,
          `${oferta.turmaNome} · ${oferta.disciplinaCodigo}`,
        );
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar a oferta.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

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
