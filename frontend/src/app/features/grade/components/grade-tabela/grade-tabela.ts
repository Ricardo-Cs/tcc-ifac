import { Component, computed, input, output } from '@angular/core';
import { Aula } from '../../../../core/models/grade.models';
import { AulaCartaoComponent } from '../aula-cartao/aula-cartao';
import { CelulaVm, LinhaVm, DIAS, chaveCelula } from '../../grade.view';

export interface EventoCelula {
  celula: CelulaVm;
  evento: DragEvent;
}

@Component({
  selector: 'app-grade-tabela',
  imports: [AulaCartaoComponent],
  templateUrl: './grade-tabela.html',
})
export class GradeTabelaComponent {
  readonly linhas = input.required<LinhaVm[]>();
  readonly celulaAlvo = input<string | null>(null);
  readonly idsEmFoco = input<Set<string>>(new Set());
  readonly editavel = input(true);
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);

  readonly sobrevoar = output<EventoCelula>();
  readonly soltar = output<EventoCelula>();
  readonly iniciarArraste = output<Aula>();
  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();
  readonly definirSala = output<Aula>();

  readonly dias = DIAS;

  readonly grupos = computed<{ turno: string; linhas: LinhaVm[] }[]>(() => {
    const grupos: { turno: string; linhas: LinhaVm[] }[] = [];
    for (const linha of this.linhas()) {
      if (grupos.length && !linha.iniciaTurno) {
        grupos[grupos.length - 1].linhas.push(linha);
      } else {
        grupos.push({ turno: linha.turnoRotulo, linhas: [linha] });
      }
    }
    return grupos;
  });

  ehAlvo(celula: CelulaVm): boolean {
    return this.celulaAlvo() === chaveCelula(celula.dia, celula.turno, celula.ordem);
  }
}
