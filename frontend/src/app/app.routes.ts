import { Routes } from '@angular/router';
import { CursosComponent } from './features/cursos/cursos';
import { DisciplinasComponent } from './features/disciplinas/disciplinas';
import { EmConstrucaoComponent } from './features/em-construcao/em-construcao';
import { PeriodosComponent } from './features/periodos/periodos';
import { GradeComponent } from './features/grade/grade';
import { GradeConsultaComponent } from './features/grade-consulta/grade-consulta';
import { ProfessoresComponent } from './features/professores/professores';
import { TurmasComponent } from './features/turmas/turmas';
import { SalasComponent } from './features/salas/salas';
import { OfertasComponent } from './features/ofertas/ofertas';
import { LoginComponent } from './features/login/login';
import { ShellComponent } from './layout/shell/shell';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'planejamento' },
      { path: 'dashboard', component: EmConstrucaoComponent, data: { titulo: 'Dashboard' } },
      { path: 'cursos', component: CursosComponent, data: { titulo: 'Cursos' } },
      { path: 'professores', component: ProfessoresComponent, data: { titulo: 'Professores' } },
      { path: 'disciplinas', component: DisciplinasComponent, data: { titulo: 'Disciplinas' } },
      { path: 'turmas', component: TurmasComponent, data: { titulo: 'Turmas' } },
      { path: 'salas', component: SalasComponent, data: { titulo: 'Salas' } },
      {
        path: 'periodos',
        component: PeriodosComponent,
        data: { titulo: 'Períodos letivos' },
      },
      { path: 'ofertas', component: OfertasComponent, data: { titulo: 'Ofertas' } },
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
        component: GradeConsultaComponent,
        data: { titulo: 'Grade por professor', dimensao: 'professor' },
      },
      {
        path: 'horarios-sala',
        component: GradeConsultaComponent,
        data: { titulo: 'Grade por sala', dimensao: 'sala' },
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
