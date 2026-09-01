import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import {
  AtualizarUsuario,
  Credenciais,
  RespostaLogin,
  TrocarSenha,
  Usuario,
} from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(credenciais: Credenciais): Observable<RespostaLogin> {
    return this.http.post<RespostaLogin>(`${API_BASE}/auth/login`, credenciais);
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${API_BASE}/auth/me`);
  }

  trocarSenha(dados: TrocarSenha): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/auth/senha`, dados);
  }

  atualizarPerfil(dados: AtualizarUsuario): Observable<Usuario> {
    return this.http.patch<Usuario>(`${API_BASE}/auth/me`, dados);
  }
}
