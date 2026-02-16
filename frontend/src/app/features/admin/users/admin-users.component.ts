import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { AdminService, AdminUserDto } from '$backend/services';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(AppToastService);

  users: AdminUserDto[] = [];
  isLoading = false;
  updatingIds = new Set<string>();

  filterControl = new FormControl('', { nonNullable: true });

  async ngOnInit() {
    await this.loadUsers();
  }

  get filteredUsers(): AdminUserDto[] {
    const query = this.filterControl.value.trim().toLowerCase();

    if (!query) {
      return this.users;
    }

    return this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      this.users = await this.adminService.apiAdminUsersGetAsync();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        this.toastService.open(message, 'error');
      } else if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  isUpdating(user: AdminUserDto): boolean {
    return this.updatingIds.has(user.id);
  }

  async banUser(user: AdminUserDto) {
    if (this.isUpdating(user)) {
      return;
    }

    try {
      this.updatingIds.add(user.id);
      this.cdr.detectChanges();

      await this.adminService.apiAdminUsersIdBanPutAsync({ id: user.id });
      user.isBanned = true;
      this.toastService.open('User has been banned.', 'info');
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        this.toastService.open(message, 'error');
      } else if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.updatingIds.delete(user.id);
      this.cdr.detectChanges();
    }
  }

  async unbanUser(user: AdminUserDto) {
    if (this.isUpdating(user)) {
      return;
    }

    try {
      this.updatingIds.add(user.id);
      this.cdr.detectChanges();

      await this.adminService.apiAdminUsersIdUnbanPutAsync({ id: user.id });
      user.isBanned = false;
      this.toastService.open('User has been unbanned.', 'info');
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        this.toastService.open(message, 'error');
      } else if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.updatingIds.delete(user.id);
      this.cdr.detectChanges();
    }
  }
}
