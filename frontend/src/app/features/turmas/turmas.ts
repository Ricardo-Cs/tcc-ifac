/**
 * Cadastro de Turmas — segue o molde de Cursos (listagem + diálogo de
 * formulário), integrado ao backend (`TurmasController`): a lista vem de
 * `GET /turmas` e o salvar/remover chamam POST/PATCH/DELETE. Toda turma
 * pertence a um curso, então o diálogo carrega os cursos (`GET /cursos`) para
 * o select; um curso inexistente é rejeitado pelo servidor (400).
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
import { Curso, Turma } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import {
  ColunaListagem,
  FiltroListagem,
  ListagemComponent,
} from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** O rascunho do formulário — os campos editáveis de uma turma. */
interface RascunhoTurma {
  cursoId: string;
  nome: string;
  semestreEntrada: string;
  quantidadeAlunos: number | null;
}

const RASCUNHO_VAZIO: RascunhoTurma = {
  cursoId: '',
  nome: '',
  semestreEntrada: '',
  quantidadeAlunos: null,
};

@Component({
  selector: 'app-turmas',
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
  templateUrl: './turmas.html',
})
export class TurmasComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly turmas = signal<Turma[]>([]);
  /** Cursos para o select do formulário — carregados junto com a tela. */
  readonly cursos = signal<Curso[]>([]);
  /** true enquanto o salvar/remover está em voo — trava os botões do diálogo. */
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Curso', largura: 'w-28' },
    { rotulo: 'Turma' },
    { rotulo: 'Ingresso', largura: 'w-32' },
    { rotulo: 'Alunos', largura: 'w-28' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Turma>[] = [
    { chave: 'curso', rotulo: 'Curso', valor: (t) => t.cursoSigla },
  ];

  readonly textoBusca = (t: Turma): string => `${t.cursoSigla} ${t.nome}`;

  constructor() {
    this.carregar();
    this.carregarCursos();
  }

  private carregar(): void {
    this.api.listarTurmas().subscribe({
      next: (turmas) => this.turmas.set(turmas),
      error: (err) =>
        this.toast.erro(
          'Falha ao carregar turmas',
          mensagemErro(err, 'Tente novamente.'),
        ),
    });
  }

  private carregarCursos(): void {
    this.api.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: (err) =>
        this.toast.erro(
          'Falha ao carregar cursos',
          mensagemErro(err, 'O select de curso ficará vazio.'),
        ),
    });
  }

  // Arrow field para o `itemToString` do hlm-select: o trigger mostra a sigla
  // do curso selecionado a partir do id guardado no rascunho.
  readonly rotuloCurso = (cursoId: string): string => {
    const curso = this.cursos().find((c) => c.id === cursoId);
    return curso ? `${curso.sigla} — ${curso.nome}` : cursoId;
  };

  // ---- Diálogo de formulário --------------------------------------------

  /** Turma em edição, ou `null` quando o diálogo está criando uma nova. */
  readonly editando = signal<Turma | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoTurma>(RASCUNHO_VAZIO);

  /** Turma à espera de confirmação de remoção — abre o diálogo de confirmar. */
  readonly removendo = signal<Turma | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar turma' : 'Nova turma',
  );

  atualizar<K extends keyof RascunhoTurma>(
    campo: K,
    valor: RascunhoTurma[K],
  ): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(turma: Turma): void {
    this.editando.set(turma);
    const { cursoId, nome, semestreEntrada, quantidadeAlunos } = turma;
    this.rascunho.set({ cursoId, nome, semestreEntrada, quantidadeAlunos });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    const semestreEntrada = r.semestreEntrada.trim();
    if (!r.cursoId || !nome || !semestreEntrada) {
      this.toast.erro(
        'Preencha os campos obrigatórios',
        'Curso, nome e semestre de ingresso são obrigatórios.',
      );
      return;
    }

    const dados = {
      cursoId: r.cursoId,
      nome,
      semestreEntrada,
      quantidadeAlunos: r.quantidadeAlunos ?? null,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarTurma(alvo.id, dados)
      : this.api.criarTurma(dados);

    requisicao.subscribe({
      next: (turma) => {
        // O servidor devolve a turma com o curso já resolvido (sigla/nome) — é
        // a fonte da verdade; refletimos exatamente ela na lista.
        this.turmas.update((lista) =>
          alvo
            ? lista.map((t) => (t.id === turma.id ? turma : t))
            : [...lista, turma],
        );
        this.toast.sucesso(`${turma.nome} ${alvo ? 'atualizada' : 'cadastrada'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar a turma.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(turma: Turma): void {
    this.removendo.set(turma);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerTurma(alvo.id).subscribe({
      next: () => {
        this.turmas.update((lista) => lista.filter((t) => t.id !== alvo.id));
        this.toast.sucesso(`${alvo.nome} removida`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover a turma.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
