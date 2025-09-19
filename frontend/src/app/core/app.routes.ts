import { Routes } from '@angular/router';
import { LayoutComponent } from 'frontend/src/app/components/layout/layout.component';
import { LoginComponent } from '../components/login/login.component';
import { RegisterComponent } from '../components/register/register.component';
import { roleGuard } from '../auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/main',
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
    data: { roles: ['Student', 'Profesor', 'Admin'] },
    component: LayoutComponent,
    children: [],
  },
];
