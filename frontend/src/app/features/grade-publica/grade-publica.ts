import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideFileDown, lucideLoaderCircle } from '@ng-icons/lucide';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { GradeApi } from '../../core/api/grade-api';
import { formatarHoras } from '../../core/format/horas';
import { Aula, Grade, PeriodoPublicado } from '../../core/models/grade.models';
import { GradeTabelaComponent } from '../grade/components/grade-tabela/grade-tabela';
import {
  LinhaVm,
  mapaConflitosPorAula,
  mapaSeveridadePorAula,
  montarLinhas,
} from '../grade/grade.view';
import { DocumentoPdf, SecaoPdf, gerarGradePdf, sanitizarNomeArquivo } from './grade-pdf';

type Dimensao = 'turma' | 'professor';

type EscopoExportacao = 'atual' | 'turmas' | 'professores';

interface OpcaoTurma {
  valor: string;
  rotulo: string;
}

interface OpcaoExportacao {
  valor: EscopoExportacao;
  titulo: string;
  detalhe: string;
}

const SUFIXO_ARQUIVO: Partial<Record<EscopoExportacao, string>> = {
  turmas: 'todas-as-turmas',
  professores: 'todos-os-professores',
};

const ROTULO_DIMENSAO: Record<Dimensao, string> = {
  turma: 'Turma',
  professor: 'Professor',
};

function formatarData(iso: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

@Component({
  selector: 'app-grade-publica',
  imports: [
    GradeTabelaComponent,
    NgIcon,
    HlmButton,
    ...HlmComboboxImports,
    ...HlmDialogImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideCheck, lucideFileDown, lucideLoaderCircle })],
  templateUrl: './grade-publica.html',
})
export class GradePublicaComponent {
  private readonly api = inject(GradeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly formatarData = formatarData;

  readonly periodos = signal<PeriodoPublicado[]>([]);
  readonly periodoCodigo = signal<string | null>(null);
  readonly periodoSelecionado = computed(
    () => this.periodos().find((p) => p.codigo === this.periodoCodigo()) ?? null,
  );

  readonly grade = signal<Grade | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  readonly dimensao = signal<Dimensao>('turma');
  readonly selecionado = signal<string | null>(null);

  private gradeCarregadaPara: string | null = null;

  constructor() {
    this.api.periodosPublicados().subscribe({
      next: (periodos) => {
        this.periodos.set(periodos);
        if (!periodos.length) {
          this.carregando.set(false);
          this.erro.set('Nenhuma grade publicada até o momento.');
          return;
        }
        const daUrl = this.route.snapshot.paramMap.get('codigo');
        const alvo = periodos.find((p) => p.codigo === daUrl) ?? periodos[0];
        this.periodoCodigo.set(alvo.codigo);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível falar com o servidor.');
      },
    });

    effect(() => {
      const codigo = this.periodoCodigo();
      if (!codigo || codigo === this.gradeCarregadaPara) return;
      this.gradeCarregadaPara = codigo;
      this.carregarGrade(codigo);
    });
  }

  readonly opcoesTurma = computed<OpcaoTurma[]>(() => {
    const g = this.grade();
    if (!g) return [];
    const nomePorCurso = new Map(g.cursos.map((c) => [c.id, c.nome]));
    const turmasComAula = new Set(g.aulas.map((a) => a.turmaId).filter((id): id is string => !!id));
    return g.turmas
      .filter((t) => turmasComAula.has(t.id))
      .map((t) => ({
        valor: t.id,
        rotulo: t.cursoId ? `${nomePorCurso.get(t.cursoId) ?? '?'} · ${t.nome}` : t.nome,
      }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  });

  readonly opcoesProfessor = computed<string[]>(() => {
    const nomes = new Set<string>();
    for (const a of this.grade()?.aulas ?? []) {
      for (const p of a.professores) nomes.add(p);
    }
    return [...nomes].sort((x, y) => x.localeCompare(y, 'pt-BR'));
  });

  readonly opcoesValores = computed<string[]>(() =>
    this.dimensao() === 'turma' ? this.opcoesTurma().map((o) => o.valor) : this.opcoesProfessor(),
  );

  readonly itemToStringOpcao = (valor: string): string => {
    if (this.dimensao() === 'turma') {
      return this.opcoesTurma().find((o) => o.valor === valor)?.rotulo ?? valor;
    }
    return valor;
  };

  readonly rotuloDimensao = (dimensao: Dimensao): string => ROTULO_DIMENSAO[dimensao];

  readonly rotuloSelecionado = computed<string | null>(() =>
    this.selecionado() ? this.itemToStringOpcao(this.selecionado()!) : null,
  );

  readonly cargaDoSelecionado = computed<number | null>(() => {
    if (this.dimensao() !== 'professor') return null;
    const nome = this.selecionado();
    return nome ? this.cargaDoProfessor(nome) : null;
  });

  readonly dialogoExportar = signal(false);
  readonly escopoExportacao = signal<EscopoExportacao>('atual');
  readonly exportando = signal(false);
  readonly erroExportacao = signal<string | null>(null);

  readonly opcoesExportacao = computed<OpcaoExportacao[]>(() => {
    const turmas = this.opcoesTurma().length;
    const professores = this.opcoesProfessor().length;
    const opcoes: OpcaoExportacao[] = [
      {
        valor: 'atual',
        titulo: 'Esta grade',
        detalhe: `${this.rotuloDimensao(this.dimensao())}: ${this.rotuloSelecionado()}`,
      },
    ];
    if (turmas) {
      opcoes.push({
        valor: 'turmas',
        titulo: 'Todas as turmas',
        detalhe: `${turmas} turma(s) — uma página por turma.`,
      });
    }
    if (professores) {
      opcoes.push({
        valor: 'professores',
        titulo: 'Todos os professores',
        detalhe: `${professores} professor(es) — uma página por professor.`,
      });
    }
    return opcoes;
  });

  readonly podeExportar = computed(() => !!this.grade() && !!this.selecionado());

  private readonly aulasDaSelecao = computed<Aula[]>(() => {
    const sel = this.selecionado();
    if (!sel) return [];
    return (this.grade()?.aulas ?? []).filter((a) =>
      this.dimensao() === 'professor' ? a.professores.includes(sel) : a.turmaId === sel,
    );
  });

  private readonly severidadePorAula = computed(() =>
    mapaSeveridadePorAula(this.grade()?.conflitos ?? []),
  );

  private readonly conflitosPorAula = computed(() =>
    mapaConflitosPorAula(this.grade()?.conflitos ?? []),
  );

  private readonly siglaPorCurso = computed(
    () => new Map((this.grade()?.cursos ?? []).map((c) => [c.id, c.sigla])),
  );

  private readonly turnos = computed<Set<string> | null>(() => {
    const set = new Set<string>();
    for (const a of this.aulasDaSelecao()) {
      if (a.slot) set.add(a.slot.turno);
    }
    return set.size ? set : null;
  });

  readonly linhas = computed<LinhaVm[]>(() =>
    montarLinhas(
      this.aulasDaSelecao(),
      this.grade()?.slots ?? [],
      this.severidadePorAula(),
      this.siglaPorCurso(),
      this.turnos(),
      this.conflitosPorAula(),
    ),
  );

  abrirExportacao(): void {
    this.escopoExportacao.set('atual');
    this.erroExportacao.set(null);
    this.dialogoExportar.set(true);
  }

  fecharExportacao(): void {
    if (this.exportando()) return;
    this.dialogoExportar.set(false);
  }

  escolherEscopo(escopo: EscopoExportacao): void {
    this.escopoExportacao.set(escopo);
  }

  async exportar(): Promise<void> {
    const documento = this.documentoParaExportar();
    if (!documento) return;
    this.exportando.set(true);
    this.erroExportacao.set(null);
    try {
      await gerarGradePdf(documento);
      this.dialogoExportar.set(false);
    } catch {
      this.erroExportacao.set('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      this.exportando.set(false);
    }
  }

  trocarPeriodo(codigo: string | null | undefined): void {
    if (!codigo || codigo === this.periodoCodigo()) return;
    this.periodoCodigo.set(codigo);
    void this.router.navigate(['/publica', codigo]);
  }

  trocarDimensao(dimensao: Dimensao): void {
    this.dimensao.set(dimensao);
    this.selecionado.set(null);
    this.selecionarPrimeiraOpcao();
  }

  selecionar(valor: string | null | undefined): void {
    this.selecionado.set(valor ?? null);
  }

  cargaFormatada(horas: number): string {
    return formatarHoras(horas);
  }

  private cargaDoProfessor(nome: string): number | null {
    const professor = (this.grade()?.professores ?? []).find((p) => p.nome === nome);
    return professor?.cargaHorariaAtual ?? null;
  }

  private linhasDe(aulas: Aula[]): LinhaVm[] {
    const turnos = new Set(
      aulas.map((a) => a.slot?.turno).filter((turno): turno is string => !!turno),
    );
    return montarLinhas(
      aulas,
      this.grade()?.slots ?? [],
      new Map(),
      this.siglaPorCurso(),
      turnos.size ? turnos : null,
      new Map(),
    );
  }

  private secaoDaTurma(turmaId: string, rotulo: string): SecaoPdf {
    const aulas = (this.grade()?.aulas ?? []).filter((a) => a.turmaId === turmaId);
    return {
      titulo: rotulo,
      subtitulo: 'Grade da turma',
      linhas: this.linhasDe(aulas),
      mostrarTurma: false,
      mostrarProfessores: true,
    };
  }

  private secaoDoProfessor(nome: string): SecaoPdf {
    const aulas = (this.grade()?.aulas ?? []).filter((a) => a.professores.includes(nome));
    const carga = this.cargaDoProfessor(nome);
    return {
      titulo: nome,
      subtitulo:
        carga === null
          ? 'Grade do professor'
          : `Grade do professor · carga atual ${formatarHoras(carga)}`,
      linhas: this.linhasDe(aulas),
      mostrarTurma: true,
      mostrarProfessores: false,
    };
  }

  private secoesDoEscopo(escopo: EscopoExportacao, selecionado: string): SecaoPdf[] {
    if (escopo === 'turmas') {
      return this.opcoesTurma().map((opcao) => this.secaoDaTurma(opcao.valor, opcao.rotulo));
    }
    if (escopo === 'professores') {
      return this.opcoesProfessor().map((nome) => this.secaoDoProfessor(nome));
    }
    return [
      this.dimensao() === 'professor'
        ? this.secaoDoProfessor(selecionado)
        : this.secaoDaTurma(selecionado, this.itemToStringOpcao(selecionado)),
    ];
  }

  private documentoParaExportar(): DocumentoPdf | null {
    const periodo = this.periodoSelecionado();
    const selecionado = this.selecionado();
    if (!periodo || !this.grade() || !selecionado) return null;

    const escopo = this.escopoExportacao();
    const secoes = this.secoesDoEscopo(escopo, selecionado);
    if (!secoes.length) return null;

    const descricao = periodo.descricao ? `${periodo.descricao} · ` : '';
    const sufixo = SUFIXO_ARQUIVO[escopo] ?? sanitizarNomeArquivo(this.rotuloSelecionado() ?? '');
    return {
      arquivo: `grade-${sanitizarNomeArquivo(periodo.codigo)}-${sufixo}.pdf`,
      periodo: periodo.codigo,
      detalhePeriodo: `Grade horária publicada · ${descricao}${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`,
      secoes,
    };
  }

  private carregarGrade(codigo: string): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.gradePublica(codigo).subscribe({
      next: (g) => {
        this.grade.set(g);
        this.carregando.set(false);
        this.selecionado.set(null);
        this.selecionarPrimeiraOpcao();
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar essa grade.');
      },
    });
  }

  private selecionarPrimeiraOpcao(): void {
    if (this.dimensao() === 'professor') {
      const opcoes = this.opcoesProfessor();
      this.selecionado.set(opcoes.length ? opcoes[0] : null);
    } else {
      const opcoes = this.opcoesTurma();
      this.selecionado.set(opcoes.length ? opcoes[0].valor : null);
    }
  }
}
