import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (!token) {
    router.navigate(['/login']);

    return false;
  }

  const required = route.data['roles'] as string[] | undefined;

  if (!required || required.length === 0) {
    return true;
  }

  const userRoles = authService.roles();
  const ok = userRoles.some((role) => required.includes(role));

  if (ok) {
    return true;
  }

  router.navigate(['/forbidden']);

  return false;
};
