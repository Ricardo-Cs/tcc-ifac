import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import {
  AtualizarCurso,
  AtualizarDisciplina,
  AtualizarOferta,
  AtualizarProfessor,
  AtualizarSala,
  AtualizarTurma,
  CriarCurso,
  CriarDisciplina,
  CriarOferta,
  CriarProfessor,
  CriarSala,
  CriarTurma,
  Curso,
  Disciplina,
  Oferta,
  PreviaImportacaoProfessores,
  Professor,
  ResultadoImportacaoProfessores,
  Sala,
  Turma,
} from '../models/academico.models';

@Injectable({ providedIn: 'root' })
export class AcademicoApi {
  private readonly http = inject(HttpClient);

  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${API_BASE}/cursos`);
  }

  criarCurso(dados: CriarCurso): Observable<Curso> {
    return this.http.post<Curso>(`${API_BASE}/cursos`, dados);
  }

  atualizarCurso(id: string, dados: AtualizarCurso): Observable<Curso> {
    return this.http.patch<Curso>(`${API_BASE}/cursos/${id}`, dados);
  }

  removerCurso(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/cursos/${id}`);
  }

  listarProfessores(): Observable<Professor[]> {
    return this.http.get<Professor[]>(`${API_BASE}/professores`);
  }

  criarProfessor(dados: CriarProfessor): Observable<Professor> {
    return this.http.post<Professor>(`${API_BASE}/professores`, dados);
  }

  atualizarProfessor(id: string, dados: AtualizarProfessor): Observable<Professor> {
    return this.http.patch<Professor>(`${API_BASE}/professores/${id}`, dados);
  }

  removerProfessor(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/professores/${id}`);
  }

  importarProfessores(arquivo: File): Observable<ResultadoImportacaoProfessores> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.post<ResultadoImportacaoProfessores>(
      `${API_BASE}/professores/importar`,
      formData,
    );
  }

  previaImportarProfessores(arquivo: File): Observable<PreviaImportacaoProfessores> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.post<PreviaImportacaoProfessores>(
      `${API_BASE}/professores/importar/preview`,
      formData,
    );
  }

  listarDisciplinas(): Observable<Disciplina[]> {
    return this.http.get<Disciplina[]>(`${API_BASE}/disciplinas`);
  }

  criarDisciplina(dados: CriarDisciplina): Observable<Disciplina> {
    return this.http.post<Disciplina>(`${API_BASE}/disciplinas`, dados);
  }

  atualizarDisciplina(id: string, dados: AtualizarDisciplina): Observable<Disciplina> {
    return this.http.patch<Disciplina>(`${API_BASE}/disciplinas/${id}`, dados);
  }

  removerDisciplina(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/disciplinas/${id}`);
  }

  listarTurmas(): Observable<Turma[]> {
    return this.http.get<Turma[]>(`${API_BASE}/turmas`);
  }

  criarTurma(dados: CriarTurma): Observable<Turma> {
    return this.http.post<Turma>(`${API_BASE}/turmas`, dados);
  }

  atualizarTurma(id: string, dados: AtualizarTurma): Observable<Turma> {
    return this.http.patch<Turma>(`${API_BASE}/turmas/${id}`, dados);
  }

  removerTurma(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/turmas/${id}`);
  }

  listarSalas(): Observable<Sala[]> {
    return this.http.get<Sala[]>(`${API_BASE}/salas`);
  }

  criarSala(dados: CriarSala): Observable<Sala> {
    return this.http.post<Sala>(`${API_BASE}/salas`, dados);
  }

  atualizarSala(id: string, dados: AtualizarSala): Observable<Sala> {
    return this.http.patch<Sala>(`${API_BASE}/salas/${id}`, dados);
  }

  removerSala(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/salas/${id}`);
  }

  listarOfertas(periodoLetivoId?: string): Observable<Oferta[]> {
    const params = periodoLetivoId
      ? new HttpParams().set('periodoLetivoId', periodoLetivoId)
      : undefined;
    return this.http.get<Oferta[]>(`${API_BASE}/ofertas`, { params });
  }

  criarOferta(dados: CriarOferta): Observable<Oferta> {
    return this.http.post<Oferta>(`${API_BASE}/ofertas`, dados);
  }

  atualizarOferta(id: string, dados: AtualizarOferta): Observable<Oferta> {
    return this.http.patch<Oferta>(`${API_BASE}/ofertas/${id}`, dados);
  }

  removerOferta(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/ofertas/${id}`);
  }
}
