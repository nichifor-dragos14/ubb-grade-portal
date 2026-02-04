import { roleGuard } from '$core/auth/role.guard';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterModule,
  Routes,
} from '@angular/router';
import { inject, NgModule } from '@angular/core';
import {
  CourseService,
  ActivityService,
  SolvedActivityService,
} from '$backend/services';
import { StudentEnrollmentsComponent } from './enrollments/student-enrollments/student-enrollments.component';
import { StudentEnrollmentViewComponent } from './enrollments/student-enrollment-view/student-enrollment-view.component';
import { DialogPageComponent } from '$shared/dialog-page';
import { SolveActivityComponent } from './activities/solve-activity.component';
import { SolvedActivityUpdateComponent } from './activities/solved-activity-update.component';

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
              course: async ({ params }: ActivatedRouteSnapshot) => {
                const router = inject(Router);
                const courseService = inject(CourseService);

                try {
                  return await courseService.apiCourseIdStudentGetAsync({
                    id: params['id'],
                  });
                } catch (error) {
                  router.navigate(['/error']);
                  return null;
                }
              },
            },
            children: [
              {
                path: 'activities',
                component: DialogPageComponent,
                children: [
                  {
                    path: ':id/view',
                    component: SolvedActivityUpdateComponent,
                    resolve: {
                      solvedActivity: async ({
                        params,
                      }: ActivatedRouteSnapshot) => {
                        const router = inject(Router);
                        const solvedActivityService = inject(
                          SolvedActivityService
                        );
                        const id = params['id'];

                        try {
                          return await solvedActivityService.apiSolvedActivityActivityIdLastGetAsync(
                            {
                              activityId: id,
                            }
                          );
                        } catch (error) {
                          router.navigate(['/error']);
                          return null;
                        }
                      },
                    },
                  },
                  {
                    path: ':id/solve',
                    component: SolveActivityComponent,
                    resolve: {
                      activity: async ({ params }: ActivatedRouteSnapshot) => {
                        const router = inject(Router);
                        const activityService = inject(ActivityService);
                        const id = params['id'];

                        try {
                          return await activityService.apiActivityIdGetAsync({
                            id,
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

