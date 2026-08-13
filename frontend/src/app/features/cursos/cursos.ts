/**
 * Cadastro de Cursos — a entidade-pai do recorte curso › turma. Estreia o par
 * "listagem + diálogo de formulário": a tabela vem do `app-listagem` e o criar/
 * editar de um `hlm-dialog` controlado por signal.
 *
 * Integrado ao backend (`CursosController`): a lista vem de `GET /cursos` e o
 * salvar/remover chamam POST/PATCH/DELETE. A unicidade da sigla é decidida pelo
 * servidor (409) — a tela só traduz a resposta em toast. É o molde de Ofertas.
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
import { Curso, Modalidade, Turno } from '../../core/models/academico.models';
import { ToastService } from '../../core/toast';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

/** Modalidades do IFAC — código do domínio + rótulo humano para exibir/filtrar. */
const MODALIDADES = [
  { valor: 'SUPERIOR', rotulo: 'Superior' },
  { valor: 'INTEGRADO', rotulo: 'Técnico Integrado' },
  { valor: 'SUBSEQUENTE', rotulo: 'Técnico Subsequente' },
] as const;

/** Turnos padrão de um curso; o rótulo humaniza o código guardado. */
const TURNOS = [
  { valor: 'MANHA', rotulo: 'Manhã' },
  { valor: 'TARDE', rotulo: 'Tarde' },
  { valor: 'NOITE', rotulo: 'Noite' },
] as const;

/** O rascunho do formulário — os campos editáveis de um curso. */
interface RascunhoCurso {
  nome: string;
  sigla: string;
  modalidade: Modalidade | '';
  turnoPadrao: Turno | '';
}

const RASCUNHO_VAZIO: RascunhoCurso = { nome: '', sigla: '', modalidade: '', turnoPadrao: '' };

@Component({
  selector: 'app-cursos',
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
  templateUrl: './cursos.html',
})
export class CursosComponent {
  private readonly api = inject(AcademicoApi);
  private readonly toast = inject(ToastService);

  readonly modalidades = MODALIDADES;
  readonly turnos = TURNOS;

  readonly cursos = signal<Curso[]>([]);
  /** true enquanto o salvar/remover está em voo — trava os botões do diálogo. */
  readonly salvando = signal(false);

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Sigla', largura: 'w-28' },
    { rotulo: 'Nome' },
    { rotulo: 'Modalidade', largura: 'w-48' },
    { rotulo: 'Turno', largura: 'w-32' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-24' },
  ];

  readonly filtros: FiltroListagem<Curso>[] = [
    { chave: 'modalidade', rotulo: 'Modalidade', valor: (c) => this.rotuloModalidade(c.modalidade) },
    { chave: 'turno', rotulo: 'Turno', valor: (c) => this.rotuloTurno(c.turnoPadrao) },
  ];

  readonly textoBusca = (c: Curso): string => `${c.sigla} ${c.nome}`;

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.api.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: (err) =>
        this.toast.erro('Falha ao carregar cursos', mensagemErro(err, 'Tente novamente.')),
    });
  }

  // Arrow fields (não métodos) para servir de `itemToString` do hlm-select: o
  // trigger deriva seu texto do VALOR selecionado via esta função, não do
  // conteúdo do item. Sem isto, o trigger mostraria o enum cru (ex.: "MANHA").
  readonly rotuloModalidade = (valor: string): string =>
    MODALIDADES.find((m) => m.valor === valor)?.rotulo ?? valor;

  readonly rotuloTurno = (valor: string): string =>
    TURNOS.find((t) => t.valor === valor)?.rotulo ?? valor;

  // ---- Diálogo de formulário --------------------------------------------

  /** Curso em edição, ou `null` quando o diálogo está criando um novo. */
  readonly editando = signal<Curso | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoCurso>(RASCUNHO_VAZIO);

  /** Curso à espera de confirmação de remoção — abre o diálogo de confirmar. */
  readonly removendo = signal<Curso | null>(null);

  readonly tituloDialog = computed(() =>
    this.editando() ? 'Editar curso' : 'Novo curso',
  );

  atualizar<K extends keyof RascunhoCurso>(campo: K, valor: RascunhoCurso[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.dialogAberto.set(true);
  }

  editar(curso: Curso): void {
    this.editando.set(curso);
    const { nome, sigla, modalidade, turnoPadrao } = curso;
    this.rascunho.set({ nome, sigla, modalidade, turnoPadrao });
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    const sigla = r.sigla.trim().toUpperCase();
    if (!nome || !sigla || !r.modalidade || !r.turnoPadrao) {
      this.toast.erro('Preencha todos os campos', 'Nome, sigla, modalidade e turno são obrigatórios.');
      return;
    }

    const dados = {
      nome,
      sigla,
      modalidade: r.modalidade,
      turnoPadrao: r.turnoPadrao,
    };
    const alvo = this.editando();
    this.salvando.set(true);

    const requisicao = alvo
      ? this.api.atualizarCurso(alvo.id, dados)
      : this.api.criarCurso(dados);

    requisicao.subscribe({
      next: (curso) => {
        // O servidor devolve o curso salvo (com id, cargaHoraria, ativo) — é a
        // fonte da verdade; refletimos exatamente ele na lista.
        this.cursos.update((lista) =>
          alvo ? lista.map((c) => (c.id === curso.id ? curso : c)) : [...lista, curso],
        );
        this.toast.sucesso(`${curso.sigla} ${alvo ? 'atualizado' : 'cadastrado'}`);
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.toast.erro(
          alvo ? 'Falha ao atualizar' : 'Falha ao cadastrar',
          mensagemErro(err, 'Não foi possível salvar o curso.'),
        );
        this.salvando.set(false);
      },
    });
  }

  // ---- Remoção -----------------------------------------------------------

  pedirRemocao(curso: Curso): void {
    this.removendo.set(curso);
  }

  cancelarRemocao(): void {
    this.removendo.set(null);
  }

  confirmarRemocao(): void {
    const alvo = this.removendo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.removerCurso(alvo.id).subscribe({
      next: () => {
        this.cursos.update((lista) => lista.filter((c) => c.id !== alvo.id));
        this.toast.sucesso(`${alvo.sigla} removido`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro('Falha ao remover', mensagemErro(err, 'Não foi possível remover o curso.'));
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }
}
