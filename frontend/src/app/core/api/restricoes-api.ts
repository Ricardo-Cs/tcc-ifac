import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import {
  ColetaRestricao,
  CriarRestricaoProfessor,
  RestricaoProfessor,
} from '../models/disponibilidade.models';

@Injectable({ providedIn: 'root' })
export class RestricoesApi {
  private readonly http = inject(HttpClient);

  coletaPorPeriodo(periodoLetivoId: string): Observable<ColetaRestricao> {
    return this.http.get<ColetaRestricao>(
      `${API_BASE}/coletas-restricao/periodo/${periodoLetivoId}`,
    );
  }

  abrirColeta(periodoLetivoId: string): Observable<ColetaRestricao> {
    return this.http.post<ColetaRestricao>(`${API_BASE}/coletas-restricao`, {
      periodoLetivoId,
    });
  }

  removerColeta(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/coletas-restricao/${id}`);
  }

  listarRestricoes(periodoLetivoId: string): Observable<RestricaoProfessor[]> {
    const params = new HttpParams().set('periodoLetivoId', periodoLetivoId);
    return this.http.get<RestricaoProfessor[]>(`${API_BASE}/restricoes-professor`, { params });
  }

  criarRestricao(dados: CriarRestricaoProfessor): Observable<RestricaoProfessor> {
    return this.http.post<RestricaoProfessor>(`${API_BASE}/restricoes-professor`, dados);
  }

  removerRestricao(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/restricoes-professor/${id}`);
  }
}
