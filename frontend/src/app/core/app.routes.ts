import { Routes } from '@angular/router';
import { LayoutComponent } from '../features/layout/layout.component';
import { LoginComponent } from '../features/login/login.component';
import { RegisterComponent } from '../features/register/register.component';
import { roleGuard } from './auth/role.guard';
import { DashboardComponent } from '$features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'main',
    redirectTo: '/main/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: '/main/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'main',
    canActivate: [roleGuard],
    data: { roles: ['Student', 'Professor', 'Admin'] },
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Student', 'Professor', 'Admin'] },
        component: DashboardComponent,
      },
      {
        path: 'professor',
        canActivate: [roleGuard],
        data: { roles: ['Professor'] },
        loadChildren: () =>
          import('../features/professor/professor.module').then(
            (m) => m.ProfessorModule
          ),
      },
      {
        path: 'student',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        loadChildren: () =>
          import('../features/student/student.module').then(
            (m) => m.StudentModule
          ),
      },
    ],
  },
];
