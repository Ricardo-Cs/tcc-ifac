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

  /**
   * Cria uma aula nova: põe uma oferta num slot. Sala fica nula (definida depois);
   * o servidor devolve a grade já recalculada, com o conflito que porventura acenda.
   */
  criar(ofertaId: string, slotHorarioId: string): Observable<Grade> {
    return this.http.post<Grade>(`${BASE}/alocacoes`, {
      ofertaId,
      slotHorarioId,
    });
  }

  /**
   * Move uma aula para outro slot (UPDATE que preserva o id da alocação). Envia a
   * `versao` que a interface viu: se a aula mudou nesse meio tempo, o servidor
   * recusa com 409 em vez de sobrescrever o trabalho de outra pessoa.
   */
  mover(alocacaoId: string, slotHorarioId: string, versao: number): Observable<Grade> {
    return this.http.patch<Grade>(`${BASE}/alocacoes/${alocacaoId}`, {
      slotHorarioId,
      versao,
    });
  }

  /** Remove a aula. `versao` viaja como query param (DELETE não leva corpo). */
  remover(alocacaoId: string, versao: number): Observable<Grade> {
    return this.http.delete<Grade>(`${BASE}/alocacoes/${alocacaoId}?versao=${versao}`);
  }

  /** Registra a decisão da comissão de conviver com um conflito aceitável. */
  aceitarConflito(chave: string, justificativa: string): Observable<Grade> {
    return this.http.post<Grade>(`${BASE}/conflitos/aceite`, {
      chave,
      justificativa,
    });
  }
}
