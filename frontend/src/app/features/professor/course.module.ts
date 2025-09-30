import { roleGuard } from '$core/auth/role.guard';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterModule,
  Routes,
} from '@angular/router';
import { ProfessorCoursesComponent } from './professor-courses/professor-courses.component';
import { ProfessorAddCourseComponent } from './professor-add-course/professor-add-course.component';
import { ProfessorUpdateCourseComponent } from './professor-update-course/professor-update-course.component';
import { inject, NgModule } from '@angular/core';
import { CourseService } from '$backend/services';
import { CourseDummyComponent } from './course.dumm.component';

const COURSE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'reinit-courses',
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
  imports: [RouterModule.forChild(COURSE_ROUTES)],
  exports: [RouterModule],
})
export class CourseModule {}
