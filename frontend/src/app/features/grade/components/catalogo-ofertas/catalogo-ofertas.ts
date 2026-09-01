import { Component, computed, input, output } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { OfertaAlocavel } from '../../../../core/models/grade.models';
import { ATRASO_ARRASTE, ItemArrastavel } from '../../grade.view';

@Component({
  selector: 'app-catalogo-ofertas',
  imports: [CdkDrag, CdkDropList],
  templateUrl: './catalogo-ofertas.html',
})
export class CatalogoOfertasComponent {
  readonly ofertas = input.required<OfertaAlocavel[]>();

  readonly terminarArraste = output<void>();

  readonly atrasoArraste = ATRASO_ARRASTE;

  readonly vazio = computed(() => this.ofertas().length === 0);

  readonly totalRestante = computed(() =>
    this.ofertas().reduce((soma, o) => soma + o.aulasRestantes, 0),
  );

  readonly itens = computed<{ oferta: OfertaAlocavel; dados: ItemArrastavel }[]>(() =>
    this.ofertas().map((oferta) => ({ oferta, dados: { tipo: 'oferta', oferta } })),
  );

  readonly aceitaOferta = (item: CdkDrag): boolean =>
    (item.data as ItemArrastavel | undefined)?.tipo === 'oferta';
}
