/**
 * A barra da tela: o recorte (curso › turma) à esquerda, o período e o placar de
 * conflitos à direita. Só controles — não sabe carregar grade nem mover aula;
 * anuncia a escolha e o container reage. Os rótulos dos selects moram aqui porque
 * é aqui que estão as listas de onde eles saem.
 */
import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { Curso, Periodo, Severidade, Turma } from '../../../../core/models/grade.models';
import { pillSeveridade } from '../../severidade';
import { TODAS_AS_TURMAS, TODOS_OS_CURSOS } from '../../grade.view';

@Component({
  selector: 'app-grade-toolbar',
  imports: [FormsModule, ...HlmSelectImports],
  templateUrl: './grade-toolbar.html',
})
export class GradeToolbarComponent {
  readonly cursos = input.required<Curso[]>();
  readonly cursoSelecionado = input<string | null>(null);
  readonly turmas = input.required<Turma[]>();
  readonly turmaSelecionada = input<string | null>(null);
  readonly periodos = input.required<Periodo[]>();
  readonly periodoAtual = input<string>('');
  readonly totais = input.required<Record<Severidade, number>>();

  readonly cursoChange = output<string>();
  readonly turmaChange = output<string>();
  readonly periodoChange = output<string>();

  readonly TODOS = TODOS_OS_CURSOS;
  readonly TODAS = TODAS_AS_TURMAS;

  readonly pillFraco = computed(() => pillSeveridade('FRACO'));
  readonly pillPotencial = computed(() => pillSeveridade('POTENCIAL'));
  readonly pillForte = computed(() => pillSeveridade('FORTE'));

  /** "SI — Sistemas para Internet": a sigla sozinha só diz algo a quem a conhece. */
  rotuloCurso = (id: string): string => {
    if (id === TODOS_OS_CURSOS) return 'Todos os cursos';
    const curso = this.cursos().find((c) => c.id === id);
    return curso ? `${curso.sigla} — ${curso.nome}` : '';
  };

  rotuloTurma = (id: string): string => {
    if (id === TODAS_AS_TURMAS) return 'Todas as turmas';
    return this.turmas().find((t) => t.id === id)?.nome ?? '';
  };

  rotuloPeriodo = (id: string): string => {
    return this.periodos().find((p) => p.id === id)?.codigo ?? '';
  };
}
