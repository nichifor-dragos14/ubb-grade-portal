import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '$core/auth/auth.service';
import { StudentDashboardComponent } from '$features/student/dashboard/student-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StudentDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  hasRole(role: string): boolean {
    return this.authService.roles().includes(role);
  }
}
