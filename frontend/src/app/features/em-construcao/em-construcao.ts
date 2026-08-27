/**
 * Espaço reservado das telas que a navegação já prevê mas o TCC ainda não
 * demonstra. Existe para que todo item do menu leve a algum lugar — menu que
 * não navega esconde o desenho do sistema.
 */
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-em-construcao',
  template: `
    <div class="p-6">
      <div class="rounded-lg border border-border bg-card p-10 text-center">
        <span class="text-[0.7rem] font-extrabold uppercase tracking-widest text-primary">Chronos</span>
        <h2 class="mt-2 text-base font-semibold tracking-tight">{{ titulo }}</h2>
        <p class="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Página em construção.
        </p>
      </div>
    </div>
  `,
})
export class EmConstrucaoComponent {
  readonly titulo =
    (inject(ActivatedRoute).snapshot.data['titulo'] as string | undefined) ?? 'Em construção';
}
