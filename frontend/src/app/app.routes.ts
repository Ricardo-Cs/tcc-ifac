import { Routes } from '@angular/router';
import { EmConstrucaoComponent } from './features/em-construcao/em-construcao';
import { GradeComponent } from './features/grade/grade';
import { ProfessoresComponent } from './features/professores/professores';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'planejamento' },
      { path: 'dashboard', component: EmConstrucaoComponent, data: { titulo: 'Dashboard' } },
      { path: 'professores', component: ProfessoresComponent, data: { titulo: 'Professores' } },
      { path: 'disciplinas', component: EmConstrucaoComponent, data: { titulo: 'Disciplinas' } },
      { path: 'turmas', component: EmConstrucaoComponent, data: { titulo: 'Turmas' } },
      { path: 'salas', component: EmConstrucaoComponent, data: { titulo: 'Salas' } },
      {
        path: 'disponibilidades',
        component: EmConstrucaoComponent,
        data: { titulo: 'Disponibilidades' },
      },
      {
        path: 'planejamento',
        component: GradeComponent,
        data: { titulo: 'Planejamento de Horários' },
      },
      { path: 'horarios', component: EmConstrucaoComponent, data: { titulo: 'Horários' } },
      {
        path: 'configuracoes',
        component: EmConstrucaoComponent,
        data: { titulo: 'Configurações' },
      },
      { path: '**', redirectTo: 'planejamento' },
    ],
  },
];
