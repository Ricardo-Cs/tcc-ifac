import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { AtualizarPeriodo, CriarPeriodo, Periodo } from '../models/grade.models';

@Injectable({ providedIn: 'root' })
export class PeriodosApi {
  private readonly http = inject(HttpClient);

  criar(dados: CriarPeriodo): Observable<Periodo> {
    return this.http.post<Periodo>(`${API_BASE}/periodos`, dados);
  }

  atualizar(id: string, dados: AtualizarPeriodo): Observable<Periodo> {
    return this.http.patch<Periodo>(`${API_BASE}/periodos/${id}`, dados);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/periodos/${id}`);
  }
}
