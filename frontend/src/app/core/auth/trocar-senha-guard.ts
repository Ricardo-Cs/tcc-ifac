import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessao } from './sessao';

export const trocarSenhaGuard: CanActivateFn = () => {
  const sessao = inject(Sessao);
  const router = inject(Router);
  if (!sessao.logado()) return router.createUrlTree(['/login']);
  if (!sessao.usuario()?.senhaProvisoria) return router.createUrlTree(['/']);
  return true;
};
