import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({ selector: 'ng-template[appLinhaListagem]' })
export class ListagemLinhaDirective {
  readonly template = inject(TemplateRef<unknown>);
}
