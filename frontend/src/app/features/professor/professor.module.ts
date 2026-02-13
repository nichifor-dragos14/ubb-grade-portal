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
import {
  ActivityService,
  CourseService,
  SolvedActivityService,
} from '$backend/services';
import { DialogPageComponent } from '$shared/dialog-page';
import { ProfessorAddActivityComponent } from './courses/professor-add-activity.component';
import { ProfessorUpdateActivityComponent } from './courses/professor-update-activity.component';
import { ProfessorActivityFeedbackComponent } from './feedback/professor-activity-feedback/professor-activity-feedback.component';
import { ProfessorGiveFeedbackComponent } from './feedback/professor-give-feedback/professor-give-feedback.component';
import { ProfessorDashboardComponent } from './dashboard/professor-dashboard.component';

const PROFESSOR_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Professor'] },
        component: ProfessorDashboardComponent,
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
            runGuardsAndResolvers: 'paramsChange',
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
            children: [
              {
                path: 'activities',
                component: DialogPageComponent,
                children: [
                  {
                    path: 'add',
                    component: ProfessorAddActivityComponent,
                    resolve: {
                      course: async ({ parent }: ActivatedRouteSnapshot) => {
                        const router = inject(Router);
                        const courseService = inject(CourseService);

                        const id = parent?.parent?.params['id'];

                        try {
                          return await courseService.apiCourseIdGetAsync({
                            id,
                          });
                        } catch (error) {
                          router.navigate(['/error']);

                          return null;
                        }
                      },
                    },
                  },
                  {
                    path: ':id',
                    component: ProfessorUpdateActivityComponent,
                    resolve: {
                      course: async ({ parent }: ActivatedRouteSnapshot) => {
                        const router = inject(Router);
                        const courseService = inject(CourseService);

                        const id = parent?.parent?.params['id'];

                        try {
                          return await courseService.apiCourseIdGetAsync({
                            id,
                          });
                        } catch (error) {
                          router.navigate(['/error']);

                          return null;
                        }
                      },
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
  {
    path: 'feedback',
    canActivate: [roleGuard],
    data: { roles: ['Professor'] },
    component: ProfessorActivityFeedbackComponent,
    children: [
      {
        path: ':id',
        component: ProfessorGiveFeedbackComponent,
        resolve: {
          solvedActivity: async ({ params }: ActivatedRouteSnapshot) => {
            const router = inject(Router);
            const solvedActivityService = inject(SolvedActivityService);

            const id = params['id'];

            try {
              return await solvedActivityService.apiSolvedActivityIdGetAsync({
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
] satisfies Routes;

@NgModule({
  imports: [RouterModule.forChild(PROFESSOR_ROUTES)],
  exports: [RouterModule],
})
export class ProfessorModule {}
