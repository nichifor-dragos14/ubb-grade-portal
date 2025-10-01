import { roleGuard } from '$core/auth/role.guard';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterModule,
  Routes,
} from '@angular/router';
import { ProfessorCoursesComponent } from './courses/professor-courses/professor-courses.component';
import { ProfessorAddCourseComponent } from './courses/professor-add-course/professor-add-course.component';
import { ProfessorUpdateCourseComponent } from './courses/professor-update-course/professor-update-course.component';
import { inject, NgModule } from '@angular/core';
import { CourseService } from '$backend/services';
import { CourseDummyComponent } from './courses/course.dummy.component';

const PROFESSOR_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'reinit-courses',
        canActivate: [roleGuard],
        data: { roles: ['Professor'] },
        component: CourseDummyComponent,
      },
      {
        path: 'courses',
        canActivate: [roleGuard],
        data: { roles: ['Professor'] },
        component: ProfessorCoursesComponent,
        children: [
          {
            path: 'new',
            canActivate: [roleGuard],
            data: { roles: ['Professor'] },
            component: ProfessorAddCourseComponent,
          },
          {
            path: ':id',
            canActivate: [roleGuard],
            data: { roles: ['Professor'] },
            runGuardsAndResolvers: 'always',
            component: ProfessorUpdateCourseComponent,
            resolve: {
              course: async ({ params }: ActivatedRouteSnapshot) => {
                const router = inject(Router);
                const courseService = inject(CourseService);

                try {
                  return await courseService.apiCourseIdGetAsync({
                    id: params['id'],
                  });
                } catch (error) {
                  router.navigate(['/error']);

                  return null;
                }
              },
            },
          },
        ],
      },
    ],
  },
] satisfies Routes;

@NgModule({
  imports: [RouterModule.forChild(PROFESSOR_ROUTES)],
  exports: [RouterModule],
})
export class ProfessorModule {}
