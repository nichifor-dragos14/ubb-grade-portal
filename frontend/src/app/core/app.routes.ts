import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { LayoutComponent } from '../features/layout/layout.component';
import { LoginComponent } from '../features/login/login.component';
import { RegisterComponent } from '../features/register/register.component';
import { roleGuard } from './auth/role.guard';
import { ProfessorCoursesComponent } from '$features/professor/professor-courses/professor-courses.component';
import { ProfessorActivityFeedbackComponent } from '$features/professor/professor-activity-feedback/professor-activity-feedback.component';
import { ProfessorLibraryComponent } from '$features/professor/professor-library/professor-library.component';
import { ProfessorAddCourseComponent } from '$features/professor/professor-add-course/professor-add-course.component';
import { ProfessorUpdateCourseComponent } from '$features/professor/professor-update-course/professor-update-course.component';
import { inject } from '@angular/core';
import { CourseService } from '$backend/services';

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
    children: [
      {
        path: 'professor',
        canActivate: [roleGuard],
        data: { roles: ['Student', 'Professor', 'Admin'] },
        loadChildren: () =>
          import('../features/professor/course.module').then(
            (m) => m.CourseModule
          ),
      },
    ],
  },
];
