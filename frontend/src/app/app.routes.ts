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
import { DisponibilidadesComponent } from './features/disponibilidades/disponibilidades';
import { LoginComponent } from './features/login/login';
import { TrocarSenhaComponent } from './features/trocar-senha/trocar-senha';
import { UsuariosComponent } from './features/usuarios/usuarios';
import { ConfiguracoesComponent } from './features/configuracoes/configuracoes';
import { GradePublicaComponent } from './features/grade-publica/grade-publica';
import { ShellComponent } from './layout/shell/shell';
import { authGuard } from './core/auth/auth-guard';
import { trocarSenhaGuard } from './core/auth/trocar-senha-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'trocar-senha', component: TrocarSenhaComponent, canActivate: [trocarSenhaGuard] },
  { path: 'publica', component: GradePublicaComponent },
  { path: 'publica/:codigo', component: GradePublicaComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'planejamento' },
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
        component: DisponibilidadesComponent,
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
      { path: 'usuarios', component: UsuariosComponent, data: { titulo: 'Usuários' } },
      {
        path: 'configuracoes',
        component: ConfiguracoesComponent,
        data: { titulo: 'Configurações' },
      },
      { path: '**', redirectTo: 'planejamento' },
    ],
  },
];
