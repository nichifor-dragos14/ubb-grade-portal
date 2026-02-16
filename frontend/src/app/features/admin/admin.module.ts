import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '$core/auth/role.guard';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminCreateProfessorComponent } from './create-professor/admin-create-professor.component';

const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        component: AdminUsersComponent,
      },
      {
        path: 'professors',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        component: AdminCreateProfessorComponent,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(ADMIN_ROUTES)],
  exports: [RouterModule],
})
export class AdminModule {}
