import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthApi } from '../../core/api/auth-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sessao } from '../../core/auth/sessao';

@Component({
  selector: 'app-login',
  imports: [FormsModule, HlmButton, HlmInput, NgIcon],
  providers: [provideIcons({ lucideCircleAlert })],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly api = inject(AuthApi);
  private readonly sessao = inject(Sessao);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly senha = signal('');
  readonly carregando = signal(false);
  /** Erro de validação local ou recusa do servidor — a tela de login fica fora
   * do shell, então não tem o hlm-toaster global; o retorno precisa ser inline. */
  readonly erro = signal<string | null>(null);

  entrar(): void {
    const email = this.email().trim();
    const senha = this.senha();
    if (!email || !senha) {
      this.erro.set('Informe e-mail e senha para acessar.');
      return;
    }

    this.carregando.set(true);
    this.api.login({ email, senha }).subscribe({
      next: (resposta) => {
        this.sessao.entrar(resposta);
        void this.router.navigate(['/']);
      },
      error: (erro: unknown) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível entrar.'));
      },
    });
  }
}
