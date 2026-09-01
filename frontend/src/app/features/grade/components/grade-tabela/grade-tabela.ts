import { Component, computed, input, output } from '@angular/core';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Aula } from '../../../../core/models/grade.models';
import { AulaCartaoComponent } from '../aula-cartao/aula-cartao';
import { CelulaVm, ItemArrastavel, LinhaVm, DIAS, chaveCelula } from '../../grade.view';

export interface EventoSoltar {
  celula: CelulaVm;
  item: ItemArrastavel;
}

@Component({
  selector: 'app-grade-tabela',
  imports: [AulaCartaoComponent, CdkDropList, CdkScrollable],
  templateUrl: './grade-tabela.html',
})
export class GradeTabelaComponent {
  readonly linhas = input.required<LinhaVm[]>();
  readonly celulaAlvo = input<string | null>(null);
  readonly idsEmFoco = input<Set<string>>(new Set());
  readonly editavel = input(true);
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);

  readonly entrarCelula = output<CelulaVm>();
  readonly sairCelula = output<void>();
  readonly soltar = output<EventoSoltar>();
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

  aoSoltar(celula: CelulaVm, evento: CdkDragDrop<CelulaVm, unknown>): void {
    const item = evento.item.data as unknown as ItemArrastavel | undefined;
    if (!item) return;
    this.soltar.emit({ celula, item });
  }
}
