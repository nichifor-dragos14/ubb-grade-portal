import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AppToastService } from '$shared/toast';

export const bannedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(AppToastService);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        const isBanned = message.toLowerCase().includes('banned');

        if (error.status === 403 && isBanned && auth.isAuthenticated()) {
          auth.logout();
          toastService.open('This account has been banned.', 'warning');
          void router.navigateByUrl('/login');
        }
      }

      return throwError(() => error);
    })
  );
};
