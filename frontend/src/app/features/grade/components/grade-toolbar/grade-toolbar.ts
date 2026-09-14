import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGlobe, lucideSend, lucideWandSparkles } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { Curso, Periodo, Severidade, Turma } from '../../../../core/models/grade.models';
import { OpcaoBusca, SelectBuscaComponent } from '../../../../shared/select-busca/select-busca';
import { pillSeveridade } from '../../severidade';
import { TODAS_AS_TURMAS } from '../../grade.view';

@Component({
  selector: 'app-grade-toolbar',
  imports: [RouterLink, NgIcon, HlmButton, SelectBuscaComponent],
  providers: [provideIcons({ lucideGlobe, lucideSend, lucideWandSparkles })],
  templateUrl: './grade-toolbar.html',
})
export class GradeToolbarComponent {
  readonly cursos = input.required<Curso[]>();
  readonly cursoSelecionado = input<string | null>(null);
  readonly turmas = input.required<Turma[]>();
  readonly turmaSelecionada = input<string | null>(null);
  readonly totais = input.required<Record<Severidade, number>>();
  readonly periodo = input<Periodo | null>(null);
  readonly editavel = input(false);
  readonly gerando = input(false);

  readonly cursoChange = output<string>();
  readonly turmaChange = output<string>();
  readonly publicar = output<void>();
  readonly gerarInicial = output<void>();

  readonly pillFraco = computed(() => pillSeveridade('FRACO'));
  readonly pillPotencial = computed(() => pillSeveridade('POTENCIAL'));
  readonly pillForte = computed(() => pillSeveridade('FORTE'));

  readonly opcoesCurso = computed<OpcaoBusca[]>(() =>
    this.cursos().map((c) => ({ valor: c.id, rotulo: `${c.sigla} — ${c.nome}` })),
  );

  readonly opcoesTurma = computed<OpcaoBusca[]>(() => {
    const turmas = this.turmas().map((t) => ({ valor: t.id, rotulo: t.nome }));
    if (turmas.length > 1) {
      turmas.push({ valor: TODAS_AS_TURMAS, rotulo: 'Todas as turmas' });
    }
    return turmas;
  });
}
