import { roleGuard } from '$core/auth/role.guard';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterModule,
  Routes,
} from '@angular/router';
import { inject, NgModule } from '@angular/core';
import { CourseService } from '$backend/services';
import { StudentEnrollmentsComponent } from './enrollments/student-enrollments/student-enrollments.component';
import { StudentEnrollmentViewComponent } from './enrollments/student-enrollment-view/student-enrollment-view.component';

const STUDENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'enrollments',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        component: StudentEnrollmentsComponent,
        children: [
          {
            path: 'course/:id',
            canActivate: [roleGuard],
            data: { roles: ['Student'] },
            runGuardsAndResolvers: 'paramsChange',
            component: StudentEnrollmentViewComponent,
            resolve: {
              //   course: async ({ params }: ActivatedRouteSnapshot) => {
              //     const router = inject(Router);
              //     const courseService = inject(CourseService);
              //     try {
              //       return await courseService.apiCourseIdGetAsync({
              //         id: params['id'],
              //       });
              //     } catch (error) {
              //       router.navigate(['/error']);
              //       return null;
              //     }
              //   },
            },
          },
        ],
      },
    ],
  },
] satisfies Routes;

@NgModule({
  imports: [RouterModule.forChild(STUDENT_ROUTES)],
  exports: [RouterModule],
})
export class StudentModule {}
