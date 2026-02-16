import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '$core/auth/role.guard';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminCreateProfessorComponent } from './create-professor/admin-create-professor.component';
import { DialogPageComponent } from '$shared/dialog-page';

const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        component: AdminUsersComponent,
        children: [
          {
            path: 'add-professor',
            canActivate: [roleGuard],
            data: { roles: ['Admin'] },
            component: DialogPageComponent,
            children: [
              {
                path: '',
                component: AdminCreateProfessorComponent,
              },
            ],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(ADMIN_ROUTES)],
  exports: [RouterModule],
})
export class AdminModule {}
