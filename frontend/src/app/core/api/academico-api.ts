import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import {
  AtualizarCurso,
  AtualizarDisciplina,
  AtualizarProfessor,
  CriarCurso,
  CriarDisciplina,
  CriarProfessor,
  Curso,
  Disciplina,
  Professor,
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

  atualizarProfessor(
    id: string,
    dados: AtualizarProfessor,
  ): Observable<Professor> {
    return this.http.patch<Professor>(`${API_BASE}/professores/${id}`, dados);
  }

  removerProfessor(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/professores/${id}`);
  }


  listarDisciplinas(): Observable<Disciplina[]> {
    return this.http.get<Disciplina[]>(`${API_BASE}/disciplinas`);
  }

  criarDisciplina(dados: CriarDisciplina): Observable<Disciplina> {
    return this.http.post<Disciplina>(`${API_BASE}/disciplinas`, dados);
  }

  atualizarDisciplina(
    id: string,
    dados: AtualizarDisciplina,
  ): Observable<Disciplina> {
    return this.http.patch<Disciplina>(`${API_BASE}/disciplinas/${id}`, dados);
  }

  removerDisciplina(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/disciplinas/${id}`);
  }
}
