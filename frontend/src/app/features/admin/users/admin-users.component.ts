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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { AdminService, AdminUserDto } from '$backend/services';
import { debounceTime, distinctUntilChanged } from 'rxjs';

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
    MatPaginatorModule,
    MatSelectModule,
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
  usersCount = 0;
  isLoading = false;
  updatingIds = new Set<string>();

  filterControl = new FormControl('', { nonNullable: true });
  roleFilterControl = new FormControl('', { nonNullable: true });

  pageIndex = 0;
  pageSize = 5;

  async ngOnInit() {
    await this.loadUsers();

    this.roleFilterControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.loadUsers();
    });

    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadUsers();
      });
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result = await this.adminService.apiAdminUsersGetAsync({
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
        role: this.roleFilterControl.value || undefined,
        searchQuery: this.filterControl.value || undefined,
      });

      this.users = result.users;
      this.usersCount = result.count;
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

  async onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    await this.loadUsers();
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
