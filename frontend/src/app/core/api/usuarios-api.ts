import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { AtualizarUsuario, CriarUsuario, Usuario } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private readonly http = inject(HttpClient);

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_BASE}/usuarios`);
  }

  criar(dados: CriarUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_BASE}/usuarios`, dados);
  }

  atualizar(id: string, dados: AtualizarUsuario): Observable<Usuario> {
    return this.http.patch<Usuario>(`${API_BASE}/usuarios/${id}`, dados);
  }

  redefinirSenha(id: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_BASE}/usuarios/${id}/redefinir-senha`, {});
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/usuarios/${id}`);
  }
}
