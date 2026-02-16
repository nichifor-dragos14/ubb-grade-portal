import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { AdminService } from '$backend/services';
import { AdminUsersEventService } from '../admin-users-event.service';

@Component({
  selector: 'app-admin-create-professor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
    AppPageHeaderComponent,
  ],
  templateUrl: './admin-create-professor.component.html',
  styleUrl: './admin-create-professor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCreateProfessorComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(AppToastService);
  private readonly adminUsersEventService = inject(AdminUsersEventService);

  isSubmitting = false;
  hide = true;

  form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).*$/),
      ],
    ],
  });

  async onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    try {
      this.isSubmitting = true;
      this.cdr.detectChanges();

      const value = this.form.getRawValue();
      await this.adminService.apiAdminProfessorsPostAsync({
        body: {
          firstName: value.firstName!,
          lastName: value.lastName!,
          email: value.email!,
          password: value.password!,
        },
      });

      this.toastService.open(
        'The professor account was successfully created ✨',
        'info'
      );
      this.adminUsersEventService.emitProfessorCreated({
        professorId: String(value.email ?? ''),
      });
      this.form.reset();
      await this.router.navigateByUrl('/main/admin/users');
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        this.toastService.open(this.getFirstErrorMessage(message), 'error');
      } else if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private getFirstErrorMessage(message: string): string {
    const first = message
      .split(/[;\n]/)
      .map((entry) => entry.trim())
      .find((entry) => entry.length > 0);

    return first ?? message;
  }
}
