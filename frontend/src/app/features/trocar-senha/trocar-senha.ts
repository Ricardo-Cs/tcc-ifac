import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideEye, lucideEyeClosed } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthApi } from '../../core/api/auth-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sessao } from '../../core/auth/sessao';

@Component({
  selector: 'app-trocar-senha',
  imports: [FormsModule, HlmButton, HlmInput, NgIcon],
  providers: [provideIcons({ lucideCircleAlert, lucideEye, lucideEyeClosed })],
  templateUrl: './trocar-senha.html',
})
export class TrocarSenhaComponent {
  private readonly api = inject(AuthApi);
  private readonly sessao = inject(Sessao);
  private readonly router = inject(Router);

  readonly senhaAtual = signal('');
  readonly novaSenha = signal('');
  readonly confirmacao = signal('');
  readonly senhaVisivel = signal(false);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }

  trocar(): void {
    const senhaAtual = this.senhaAtual();
    const novaSenha = this.novaSenha();

    if (!senhaAtual || !novaSenha || !this.confirmacao()) {
      this.erro.set('Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      this.erro.set('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== this.confirmacao()) {
      this.erro.set('A confirmação não confere com a nova senha.');
      return;
    }
    this.erro.set(null);

    this.carregando.set(true);
    this.api.trocarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        const usuario = this.sessao.usuario();
        if (usuario) this.sessao.atualizarUsuario({ ...usuario, senhaProvisoria: false });
        void this.router.navigate(['/']);
      },
      error: (erro: unknown) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível trocar a senha.'));
      },
    });
  }

  sair(): void {
    this.sessao.sair();
    void this.router.navigate(['/login']);
  }
}
