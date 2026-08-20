import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthApi } from '../../core/api/auth-api';
import { mensagemErro } from '../../core/api/erro-http';
import { Sessao } from '../../core/auth/sessao';
import { ToastService } from '../../core/toast';

@Component({
  selector: 'app-login',
  imports: [FormsModule, HlmButton, HlmInput],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly api = inject(AuthApi);
  private readonly sessao = inject(Sessao);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly senha = signal('');
  readonly carregando = signal(false);

  entrar(): void {
    const email = this.email().trim();
    const senha = this.senha();
    if (!email || !senha) {
      this.toast.aviso('Informe e-mail e senha para acessar.');
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
        this.toast.erro(mensagemErro(erro, 'Não foi possível entrar.'));
      },
    });
  }
}
