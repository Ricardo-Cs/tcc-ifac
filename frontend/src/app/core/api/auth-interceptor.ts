import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sessao } from '../auth/sessao';

/**
 * Anexa `Authorization: Bearer <token>` quando há sessão e, num 401, encerra a
 * sessão e manda para o login. O próprio login (que responde 401 em credencial
 * errada) é poupado do redirecionamento — a tela trata o erro.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessao = inject(Sessao);
  const router = inject(Router);
  const token = sessao.token();

  const requisicao = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      const ehLogin = req.url.endsWith('/auth/login');
      if (erro instanceof HttpErrorResponse && erro.status === 401 && !ehLogin) {
        sessao.sair();
        void router.navigate(['/login']);
      }
      return throwError(() => erro);
    }),
  );
};
