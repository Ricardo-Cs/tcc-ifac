import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDoorOpen } from '@ng-icons/lucide';
import { Sala } from '../../../../core/models/academico.models';
import { rotuloTipoSala, salasElegiveis } from '../../../../core/salas';
import { Aula } from '../../../../core/models/grade.models';
import { FormDialogComponent } from '../../../../shared/form-dialog/form-dialog';
import { OpcaoBusca, SelectBuscaComponent } from '../../../../shared/select-busca/select-busca';

export const SEM_SALA = '__sem-sala__';

@Component({
  selector: 'app-sala-dialog',
  imports: [FormsModule, NgIcon, FormDialogComponent, SelectBuscaComponent],
  providers: [provideIcons({ lucideDoorOpen })],
  templateUrl: './sala-dialog.html',
})
export class SalaDialogComponent {
  readonly aula = input<Aula | null>(null);
  readonly salas = input<readonly Sala[]>([]);
  readonly ocupadas = input<ReadonlySet<string>>(new Set<string>());
  readonly salvando = input(false);

  readonly fechar = output<void>();
  readonly confirmar = output<string | null>();

  readonly semSala = SEM_SALA;

  readonly escolha = linkedSignal(() => this.aula()?.salaId ?? SEM_SALA);

  readonly tipoSalaExigido = computed(() => this.aula()?.disciplina?.tipoSalaRequerido ?? null);

  readonly opcoes = computed<readonly Sala[]>(() =>
    salasElegiveis(this.salas(), this.tipoSalaExigido(), this.aula()?.salaId ?? null),
  );

  readonly rotuloTipoSala = rotuloTipoSala;

  readonly descricao = computed(() => {
    const aula = this.aula();
    if (!aula) return '';
    const disciplina = aula.disciplina?.nome ?? 'Aula';
    return aula.turma ? `${disciplina} · ${aula.turma}` : disciplina;
  });

  readonly opcoesSala = computed<OpcaoBusca[]>(() => [
    { valor: SEM_SALA, rotulo: 'Sem sala' },
    ...this.opcoes().map((s) => ({
      valor: s.id,
      rotulo: s.nome,
      detalhe: [rotuloTipoSala(s.tipo), s.capacidade ? `${s.capacidade} lugares` : '']
        .filter(Boolean)
        .join(' \u00b7 '),
      marcador: this.ocupadas().has(s.id) ? 'ocupada' : undefined,
      desabilitado: this.ocupadas().has(s.id),
    })),
  ]);

  submeter(): void {
    const escolha = this.escolha();
    this.confirmar.emit(escolha === SEM_SALA ? null : escolha);
  }
}
