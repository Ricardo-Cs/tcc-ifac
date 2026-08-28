import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideKeyRound, lucidePencil, lucideShieldUser, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { UsuariosApi } from '../../core/api/usuarios-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sessao } from '../../core/auth/sessao';
import { PapelUsuario, Usuario } from '../../core/models/usuario.models';
import { ToastService } from '../../core/toast';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog';
import { ColunaListagem, FiltroListagem, ListagemComponent } from '../../shared/listagem/listagem';
import { ListagemLinhaDirective } from '../../shared/listagem/listagem-linha';

const PAPEIS = [
  { valor: 'ADMIN', rotulo: 'Administrador' },
  { valor: 'COMISSAO', rotulo: 'Comissão de horários' },
  { valor: 'CONSULTA', rotulo: 'Consulta' },
] as const;

interface RascunhoUsuario {
  nome: string;
  email: string;
  papel: PapelUsuario | '';
}

const RASCUNHO_VAZIO: RascunhoUsuario = { nome: '', email: '', papel: '' };

const SENHA_PADRAO_INICIAL = 'senha123';

@Component({
  selector: 'app-usuarios',
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
  providers: [provideIcons({ lucideKeyRound, lucidePencil, lucideShieldUser, lucideTrash2 })],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent {
  private readonly api = inject(UsuariosApi);
  private readonly toast = inject(ToastService);
  private readonly sessao = inject(Sessao);

  readonly ehAdmin = computed(() => this.sessao.usuario()?.papel === 'ADMIN');

  readonly papeis = PAPEIS;

  readonly usuarios = signal<Usuario[]>([]);
  readonly salvando = signal(false);
  readonly senhaPadrao = SENHA_PADRAO_INICIAL;

  readonly colunas: ColunaListagem[] = [
    { rotulo: 'Nome' },
    { rotulo: 'E-mail' },
    { rotulo: 'Papel', largura: 'w-48' },
    { rotulo: 'Status', largura: 'w-28' },
    { rotulo: 'Ações', alinhamento: 'fim', largura: 'w-28' },
  ];

  readonly filtros: FiltroListagem<Usuario>[] = [
    { chave: 'papel', rotulo: 'Papel', valor: (u) => this.rotuloPapel(u.papel) },
  ];

  readonly textoBusca = (u: Usuario): string => `${u.nome} ${u.email}`;

  constructor() {
    if (this.ehAdmin()) this.carregar();
  }

  private carregar(): void {
    this.api.listar().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (err) =>
        this.toast.erro('Falha ao carregar usuários', mensagemErro(err, 'Tente novamente.')),
    });
  }

  readonly rotuloPapel = (valor: string): string =>
    PAPEIS.find((p) => p.valor === valor)?.rotulo ?? valor;

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  ehEuMesmo(usuario: Usuario): boolean {
    return usuario.id === this.sessao.usuario()?.id;
  }

  readonly editando = signal<Usuario | null>(null);
  readonly dialogAberto = signal(false);
  readonly rascunho = signal<RascunhoUsuario>(RASCUNHO_VAZIO);
  readonly erroForm = signal<string | null>(null);

  readonly removendo = signal<Usuario | null>(null);

  readonly tituloDialog = computed(() => (this.editando() ? 'Editar usuário' : 'Novo usuário'));

  atualizar<K extends keyof RascunhoUsuario>(campo: K, valor: RascunhoUsuario[K]): void {
    this.rascunho.update((r) => ({ ...r, [campo]: valor }));
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.rascunho.set(RASCUNHO_VAZIO);
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  editar(usuario: Usuario): void {
    this.editando.set(usuario);
    this.rascunho.set({ nome: usuario.nome, email: usuario.email, papel: usuario.papel });
    this.erroForm.set(null);
    this.dialogAberto.set(true);
  }

  fecharDialog(): void {
    this.dialogAberto.set(false);
  }

  salvar(): void {
    const r = this.rascunho();
    const nome = r.nome.trim();
    const email = r.email.trim();
    const alvo = this.editando();

    if (!nome || !email || !r.papel) {
      this.erroForm.set('Nome, e-mail e papel são obrigatórios.');
      return;
    }
    this.erroForm.set(null);

    const dados = { nome, email, papel: r.papel };
    this.salvando.set(true);

    const requisicao = alvo ? this.api.atualizar(alvo.id, dados) : this.api.criar(dados);

    requisicao.subscribe({
      next: (usuario) => {
        this.usuarios.update((lista) =>
          alvo ? lista.map((u) => (u.id === usuario.id ? usuario : u)) : [...lista, usuario],
        );
        if (alvo) {
          this.toast.sucesso(`${usuario.nome} atualizado`);
        } else {
          this.toast.sucesso(
            `${usuario.nome} cadastrado`,
            `Senha inicial: ${SENHA_PADRAO_INICIAL} — repasse e peça para trocar no primeiro login.`,
          );
        }
        this.salvando.set(false);
        this.fecharDialog();
      },
      error: (err) => {
        this.erroForm.set(mensagemErro(err, 'Não foi possível salvar o usuário.'));
        this.salvando.set(false);
      },
    });
  }

  pedirRemocao(usuario: Usuario): void {
    this.removendo.set(usuario);
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
        this.usuarios.update((lista) => lista.filter((u) => u.id !== alvo.id));
        this.toast.sucesso(`${alvo.nome} removido`);
        this.salvando.set(false);
        this.removendo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao remover',
          mensagemErro(err, 'Não foi possível remover o usuário.'),
        );
        this.salvando.set(false);
        this.removendo.set(null);
      },
    });
  }

  readonly redefinindo = signal<Usuario | null>(null);

  pedirRedefinicaoSenha(usuario: Usuario): void {
    this.redefinindo.set(usuario);
  }

  cancelarRedefinicaoSenha(): void {
    this.redefinindo.set(null);
  }

  confirmarRedefinicaoSenha(): void {
    const alvo = this.redefinindo();
    if (!alvo) return;
    this.salvando.set(true);
    this.api.redefinirSenha(alvo.id).subscribe({
      next: (usuario) => {
        this.usuarios.update((lista) => lista.map((u) => (u.id === usuario.id ? usuario : u)));
        this.toast.sucesso(
          `Senha de ${usuario.nome} redefinida`,
          `Nova senha inicial: ${SENHA_PADRAO_INICIAL} — repasse e peça para trocar no próximo login.`,
        );
        this.salvando.set(false);
        this.redefinindo.set(null);
      },
      error: (err) => {
        this.toast.erro(
          'Falha ao redefinir senha',
          mensagemErro(err, 'Não foi possível redefinir a senha.'),
        );
        this.salvando.set(false);
        this.redefinindo.set(null);
      },
    });
  }
}
