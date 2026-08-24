import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { Curso, Severidade, Turma } from '../../../../core/models/grade.models';
import { pillSeveridade } from '../../severidade';
import { TODAS_AS_TURMAS } from '../../grade.view';

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
  readonly totais = input.required<Record<Severidade, number>>();

  readonly cursoChange = output<string>();
  readonly turmaChange = output<string>();

  readonly TODAS = TODAS_AS_TURMAS;

  readonly pillFraco = computed(() => pillSeveridade('FRACO'));
  readonly pillPotencial = computed(() => pillSeveridade('POTENCIAL'));
  readonly pillForte = computed(() => pillSeveridade('FORTE'));

  rotuloCurso = (id: string): string => {
    const curso = this.cursos().find((c) => c.id === id);
    return curso ? `${curso.sigla} — ${curso.nome}` : '';
  };

  rotuloTurma = (id: string): string => {
    if (id === TODAS_AS_TURMAS) return 'Todas as turmas';
    return this.turmas().find((t) => t.id === id)?.nome ?? '';
  };
}
