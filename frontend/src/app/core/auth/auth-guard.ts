import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessao } from './sessao';

/** Bloqueia rotas protegidas: sem sessão, redireciona para o login. */
export const authGuard: CanActivateFn = () => {
  const sessao = inject(Sessao);
  const router = inject(Router);
  return sessao.logado() ? true : router.createUrlTree(['/login']);
};
