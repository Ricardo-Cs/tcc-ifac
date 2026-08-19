/**
 * A grade em si — horários (linhas) × dias (colunas). Recebe as linhas já
 * montadas e só desenha; o arraste e a soltura ela apenas anuncia, para o
 * container mover a aula e devolver a grade recalculada.
 */
import { Component, computed, input, output } from '@angular/core';
import { Aula } from '../../../../core/models/grade.models';
import { AulaCartaoComponent } from '../aula-cartao/aula-cartao';
import { CelulaVm, LinhaVm, DIAS, chaveCelula } from '../../grade.view';

/** O que uma célula anuncia num arraste — o alvo e o evento cru para o container. */
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
  /** Chave da célula sob o cursor (`chaveCelula`), ou `null` fora de um arraste. */
  readonly celulaAlvo = input<string | null>(null);
  /** Ids das aulas envolvidas no conflito em foco — recebem anel de realce. */
  readonly idsEmFoco = input<Set<string>>(new Set());
  /** Período editável: `false` desliga o arraste e o remover (período passado). */
  readonly editavel = input(true);
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);

  readonly sobrevoar = output<EventoCelula>();
  readonly soltar = output<EventoCelula>();
  readonly iniciarArraste = output<Aula>();
  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();

  readonly dias = DIAS;

  /**
   * Cada turno vira sua própria tabela — manhã, tarde e noite são grades
   * distintas, empilhadas com um respiro entre elas, e não faixas coladas numa
   * tabela só. `iniciaTurno` (já calculado em `montarLinhas`) marca onde um bloco
   * começa; aqui só se recorta a lista nesses pontos.
   */
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
