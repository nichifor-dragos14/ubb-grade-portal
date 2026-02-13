import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-role-dashboard-redirect',
  template: '',
  standalone: true,
})
export class RoleDashboardRedirectComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit() {
    const roles = this.authService.roles();

    if (roles.includes('Student')) {
      await this.router.navigateByUrl('/main/student/dashboard');
      return;
    }

    if (roles.includes('Professor')) {
      await this.router.navigateByUrl('/main/professor/dashboard');
      return;
    }

    if (roles.includes('Admin')) {
      await this.router.navigateByUrl('/main/admin/users');
      return;
    }

    await this.router.navigateByUrl('/login');
  }
}
