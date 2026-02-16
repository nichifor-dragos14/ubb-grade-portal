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
import { StudentFindCoursesComponent } from './enrollments/student-find-courses/student-find-courses.component';
import { DialogPageComponent } from '$shared/dialog-page';
import { SolveActivityComponent } from './activities/solve-activity.component';
import { SolvedActivityUpdateComponent } from './activities/solved-activity-update.component';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { StudentLeaderboardsComponent } from './leaderboards/student-leaderboards.component';

const STUDENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        component: StudentDashboardComponent,
      },
      {
        path: 'leaderboards',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        component: StudentLeaderboardsComponent,
      },
      {
        path: 'enrollments',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        component: StudentEnrollmentsComponent,
        children: [
          {
            path: 'find',
            component: DialogPageComponent,
            children: [
              {
                path: '',
                component: StudentFindCoursesComponent,
              },
            ],
          },
          {
            path: 'course/:id',
            canActivate: [roleGuard],
            data: { roles: ['Student'] },
            runGuardsAndResolvers: 'paramsChange',
            component: StudentEnrollmentViewComponent,
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
              {
                path: 'find',
                component: DialogPageComponent,
                children: [
                  {
                    path: '',
                    component: StudentFindCoursesComponent,
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
