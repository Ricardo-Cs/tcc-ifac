import { Routes } from '@angular/router';
import { CursosComponent } from './features/cursos/cursos';
import { DisciplinasComponent } from './features/disciplinas/disciplinas';
import { EmConstrucaoComponent } from './features/em-construcao/em-construcao';
import { PeriodosComponent } from './features/periodos/periodos';
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
      { path: 'cursos', component: CursosComponent, data: { titulo: 'Cursos' } },
      { path: 'professores', component: ProfessoresComponent, data: { titulo: 'Professores' } },
      { path: 'disciplinas', component: DisciplinasComponent, data: { titulo: 'Disciplinas' } },
      { path: 'turmas', component: EmConstrucaoComponent, data: { titulo: 'Turmas' } },
      { path: 'salas', component: EmConstrucaoComponent, data: { titulo: 'Salas' } },
      {
        path: 'periodos',
        component: PeriodosComponent,
        data: { titulo: 'Períodos letivos' },
      },
      { path: 'ofertas', component: EmConstrucaoComponent, data: { titulo: 'Ofertas' } },
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
      { path: 'horarios', component: EmConstrucaoComponent, data: { titulo: 'Grade da turma' } },
      {
        path: 'horarios-professor',
        component: EmConstrucaoComponent,
        data: { titulo: 'Grade por professor' },
      },
      {
        path: 'horarios-sala',
        component: EmConstrucaoComponent,
        data: { titulo: 'Grade por sala' },
      },
      {
        path: 'configuracoes',
        component: EmConstrucaoComponent,
        data: { titulo: 'Configurações' },
      },
      { path: '**', redirectTo: 'planejamento' },
    ],
  },
];
