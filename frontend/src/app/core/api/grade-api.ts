import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Grade, OfertaAlocavel, Periodo } from '../models/grade.models';
import { API_BASE as BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class GradeApi {
  private readonly http = inject(HttpClient);

  periodos(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(`${BASE}/periodos`);
  }

  gradeAtual(): Observable<Grade> {
    return this.http.get<Grade>(`${BASE}/grade/atual`);
  }

  grade(periodoId: string): Observable<Grade> {
    return this.http.get<Grade>(`${BASE}/grade/${periodoId}`);
  }

  /** Catálogo de ofertas com aula a alocar no período — a fonte do arraste. */
  ofertasAlocaveis(periodoId: string): Observable<OfertaAlocavel[]> {
    return this.http.get<OfertaAlocavel[]>(`${BASE}/grade/${periodoId}/ofertas-alocaveis`);
  }

  /** Move uma aula para outro slot (UPDATE que preserva o id da alocação). */
  mover(alocacaoId: string, slotHorarioId: string): Observable<Grade> {
    return this.http.patch<Grade>(`${BASE}/alocacoes/${alocacaoId}`, {
      slotHorarioId,
    });
  }

  remover(alocacaoId: string): Observable<Grade> {
    return this.http.delete<Grade>(`${BASE}/alocacoes/${alocacaoId}`);
  }

  /** Registra a decisão da comissão de conviver com um conflito aceitável. */
  aceitarConflito(chave: string, justificativa: string): Observable<Grade> {
    return this.http.post<Grade>(`${BASE}/conflitos/aceite`, {
      chave,
      justificativa,
    });
  }
}
