import { Routes } from '@angular/router';
import { LayoutComponent } from '../features/layout/layout.component';
import { LoginComponent } from '../features/login/login.component';
import { RegisterComponent } from '../features/register/register.component';
import { roleGuard } from './auth/role.guard';

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
    data: { roles: ['Student', 'Professor', 'Admin'] },
    component: LayoutComponent,
    children: [],
  },
];
