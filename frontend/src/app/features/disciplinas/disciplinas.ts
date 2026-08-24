import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AcademicoApi } from '../../core/api/academico-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Curso, Disciplina, TipoSala } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

const TIPOS_SALA = [
  { valor: 'COMUM', rotulo: 'Comum' },
  { valor: 'LABORATORIO', rotulo: 'Laboratório' },
  { valor: 'AUDITORIO', rotulo: 'Auditório' },
  { valor: 'QUADRA', rotulo: 'Quadra' },
] as const;

const SEM_EXIGENCIA = '';

interface RascunhoDisciplina {
  cursoId: string;
  codigo: string;
  nome: string;
  periodoCurso: number | null;
  cargaHoraria: number | null;
  tipoSalaRequerido: TipoSala | '';
}

const RASCUNHO_VAZIO: RascunhoDisciplina = {
  cursoId: '',
  codigo: '',
  nome: '',
  periodoCurso: null,
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
    FormDialogComponent,
    ConfirmDialogComponent,
    ListagemComponent,
    ListagemLinhaDirective,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideBookOpen, lucidePencil, lucideTrash2 })],
  templateUrl: './disciplinas.html',
})
export class DisciplinasComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly tiposSala = TIPOS_SALA;
  readonly semExigencia = SEM_EXIGENCIA;

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Curso', largura: 'w-28' },
    { rotulo: 'Código', largura: 'w-28' },
    { rotulo: 'Nome' },
    { rotulo: 'Fase', alinhamento: 'fim', largura: 'w-20' },
    { rotulo: 'Carga horária', alinhamento: 'fim', largura: 'w-36' },
    { rotulo: 'Tipo de sala', largura: 'w-40' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Disciplina>[] = [
    { chave: 'curso', rotulo: 'Curso', valor: (d) => d.cursoSigla },
    {
      chave: 'tipoSala',
      rotulo: 'Tipo de sala',
      valor: (d) => this.rotuloTipoSala(d.tipoSalaRequerido),
    },
  ];

  readonly textoBusca = (d: Disciplina): string => `${d.cursoSigla} ${d.codigo} ${d.nome}`;

  constructor() {
    this.carregar();
    this.api.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: () => this.cursos.set([]),
    });
  }

  private carregar(): void {
    this.api.listarDisciplinas().subscribe({
      next: (disciplinas) => this.disciplinas.set(disciplinas),
      error: (err) =>
        this.toast.erro('Falha ao carregar disciplinas', mensagemErro(err, 'Tente novamente.')),
    });
  }

  readonly rotuloTipoSala = (valor: string | null): string => {
    if (!valor) return 'Comum';
    return TIPOS_SALA.find((t) => t.valor === valor)?.rotulo ?? valor;
  };

  readonly rotuloCurso = (cursoId: string): string => {
    const curso = this.cursos().find((c) => c.id === cursoId);
    return curso ? `${curso.sigla} — ${curso.nome}` : cursoId;
  };

  rotuloFase(periodoCurso: number | null): string {
    return periodoCurso ? `${periodoCurso}ª` : '—';
  }

  cargaFormatada(horas: number): string {
    return `${Number.isInteger(horas) ? horas : horas.toFixed(2)} h`;
  }

  readonly editando = signal<Disciplina | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoDisciplina>(RASCUNHO_VAZIO);
  readonly erroForm = signal<string | null>(null);

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
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  editar(disciplina: Disciplina): void {
    this.editando.set(disciplina);
    this.rascunho.set({
      cursoId: disciplina.cursoId,
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      periodoCurso: disciplina.periodoCurso,
      cargaHoraria: disciplina.cargaHoraria,
      tipoSalaRequerido: disciplina.tipoSalaRequerido ?? '',
    });
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const codigo = r.codigo.trim().toUpperCase();
    const nome = r.nome.trim();
    if (!r.cursoId) {
      this.erroForm.set('Selecione o curso a que a disciplina pertence.');
      return;
    }
    if (!codigo || !nome) {
      this.erroForm.set('Código e nome são obrigatórios.');
      return;
    }
    if (r.cargaHoraria == null || r.cargaHoraria <= 0) {
      this.erroForm.set('Informe a carga horária em horas (maior que zero).');
      return;
    }
    this.erroForm.set(null);

    const dados = {
      cursoId: r.cursoId,
      codigo,
      nome,
      periodoCurso: r.periodoCurso,
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
          alvo
            ? lista.map((d) => (d.id === disciplina.id ? disciplina : d))
            : [...lista, disciplina],
        );
        this.toast.sucesso(
          `${disciplina.codigo} ${alvo ? 'atualizada' : 'cadastrada'}`,
          disciplina.cursoSigla,
        );
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.erroForm.set(mensagemErro(err, 'Não foi possível salvar a disciplina.'));
        this.salvando.set(false);
      },
    });
  }

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
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover a disciplina.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
