import { Injectable, computed, signal } from '@angular/core';
import { RespostaLogin, Usuario } from '../models/usuario.models';

const CHAVE_TOKEN = 'chronos:token';
const CHAVE_USUARIO = 'chronos:usuario';

/**
 * Estado da sessão do usuário. Guarda o token JWT e o usuário autenticado em
 * signals e os persiste no localStorage — assim um F5 mantém a sessão sem nova
 * chamada ao servidor (o token, se inválido, é derrubado pelo interceptor no
 * primeiro 401).
 */
@Injectable({ providedIn: 'root' })
export class Sessao {
  private readonly _token = signal<string | null>(lerToken());
  private readonly _usuario = signal<Usuario | null>(lerUsuario());

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._token() !== null);

  entrar(resposta: RespostaLogin): void {
    this._token.set(resposta.token);
    this._usuario.set(resposta.usuario);
    localStorage.setItem(CHAVE_TOKEN, resposta.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.usuario));
  }

  sair(): void {
    this._token.set(null);
    this._usuario.set(null);
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
  }
}

function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

function lerUsuario(): Usuario | null {
  const cru = localStorage.getItem(CHAVE_USUARIO);
  if (!cru) return null;
  try {
    return JSON.parse(cru) as Usuario;
  } catch {
    return null;
  }
}
