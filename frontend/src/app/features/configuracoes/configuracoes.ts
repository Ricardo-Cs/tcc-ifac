import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleAlert,
  lucideEye,
  lucideEyeClosed,
  lucideKeyRound,
  lucideMail,
  lucideShieldUser,
  lucideUserRound,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthApi } from '../../core/api/auth-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sessao } from '../../core/auth/sessao';
import { ToastService } from '../../core/toast';

const PAPEIS: Record<string, string> = {
  ADMIN: 'Administrador',
  COMISSAO: 'Comissão de horários',
  CONSULTA: 'Consulta',
};

@Component({
  selector: 'app-configuracoes',
  imports: [FormsModule, NgIcon, HlmButton, HlmInput],
  providers: [
    provideIcons({
      lucideCircleAlert,
      lucideEye,
      lucideEyeClosed,
      lucideKeyRound,
      lucideMail,
      lucideShieldUser,
      lucideUserRound,
    }),
  ],
  templateUrl: './configuracoes.html',
})
export class ConfiguracoesComponent {
  private readonly api = inject(AuthApi);
  private readonly sessao = inject(Sessao);
  private readonly toast = inject(ToastService);

  readonly usuario = this.sessao.usuario;

  readonly rotuloPapel = computed(() => {
    const papel = this.usuario()?.papel;
    return papel ? (PAPEIS[papel] ?? papel) : '';
  });

  readonly iniciais = computed(() => {
    const nome = this.usuario()?.nome.trim();
    if (!nome) return '?';
    const partes = nome.split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  });

  readonly nome = signal(this.usuario()?.nome ?? '');
  readonly email = signal(this.usuario()?.email ?? '');
  readonly salvandoPerfil = signal(false);
  readonly erroPerfil = signal<string | null>(null);

  salvarPerfil(): void {
    const nome = this.nome().trim();
    const email = this.email().trim();
    if (!nome || !email) {
      this.erroPerfil.set('Preencha nome e e-mail.');
      return;
    }
    this.erroPerfil.set(null);

    this.salvandoPerfil.set(true);
    this.api.atualizarPerfil({ nome, email }).subscribe({
      next: (usuario) => {
        this.sessao.atualizarUsuario(usuario);
        this.nome.set(usuario.nome);
        this.email.set(usuario.email);
        this.salvandoPerfil.set(false);
        this.toast.sucesso('Perfil atualizado com sucesso');
      },
      error: (erro: unknown) => {
        this.salvandoPerfil.set(false);
        this.erroPerfil.set(mensagemErro(erro, 'Não foi possível atualizar o perfil.'));
      },
    });
  }

  readonly senhaAtual = signal('');
  readonly novaSenha = signal('');
  readonly confirmacao = signal('');
  readonly senhaVisivel = signal(false);
  readonly salvandoSenha = signal(false);
  readonly erroSenha = signal<string | null>(null);

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }

  trocarSenha(): void {
    const senhaAtual = this.senhaAtual();
    const novaSenha = this.novaSenha();

    if (!senhaAtual || !novaSenha || !this.confirmacao()) {
      this.erroSenha.set('Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      this.erroSenha.set('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== this.confirmacao()) {
      this.erroSenha.set('A confirmação não confere com a nova senha.');
      return;
    }
    this.erroSenha.set(null);

    this.salvandoSenha.set(true);
    this.api.trocarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        const usuario = this.usuario();
        if (usuario) this.sessao.atualizarUsuario({ ...usuario, senhaProvisoria: false });
        this.senhaAtual.set('');
        this.novaSenha.set('');
        this.confirmacao.set('');
        this.salvandoSenha.set(false);
        this.toast.sucesso('Senha alterada com sucesso');
      },
      error: (erro: unknown) => {
        this.salvandoSenha.set(false);
        this.erroSenha.set(mensagemErro(erro, 'Não foi possível trocar a senha.'));
      },
    });
  }
}
