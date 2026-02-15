import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  @ViewChild('drawer', { static: true }) drawer!: MatDrawer;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);

  notifications = this.notificationsService.notifications;
  unreadCount = this.notificationsService.unreadCount;

  get roles(): string[] {
    return this.authService.roles();
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  ngOnInit(): void {
    this.notificationsService.connect();
    void this.notificationsService.refresh();
  }

  async onLogout() {
    await this.notificationsService.disconnect();
    this.authService.logout();
    await this.router.navigateByUrl('/login');
  }

  toggleSidenav() {
    this.drawer.toggle();
  }

  isSectionActive(prefix: string): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return currentUrl.startsWith(prefix);
  }

  async onSectionNavigate(targetUrl: string) {
    if (this.isSectionActive(targetUrl)) {
      return;
    }

    await this.router.navigateByUrl(targetUrl);
  }

  onNavClick(event: MouseEvent, targetPrefix: string) {
    const currentUrl = this.router.url.split('?')[0];

    if (currentUrl.startsWith(targetPrefix)) {
      console.log(currentUrl, targetPrefix);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async onMarkAllRead() {
    await this.notificationsService.markAllAsRead();
  }

  async onNotificationClick(notification: {
    courseId?: string | null;
    activityId?: string | null;
  }) {
    const courseId = notification.courseId ?? undefined;
    const activityId = notification.activityId ?? undefined;

    if (courseId && activityId && this.hasRole('Student')) {
      await this.router.navigateByUrl(
        `/main/student/enrollments/course/${courseId}/activities/${activityId}/view`
      );
      return;
    }

    if (this.hasRole('Professor')) {
      await this.router.navigateByUrl('/main/professor/feedback');
    }
  }
}
