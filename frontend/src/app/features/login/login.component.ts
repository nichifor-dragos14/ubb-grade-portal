import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppToastService } from '$shared/toast';
import { AccountService } from '$backend/services';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationsService } from '$core/notifications/notifications.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly toastService = inject(AppToastService);
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);

  hide = true;

  submitting = false;
  redirecting = false;

  loginFormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get email() {
    return this.loginFormGroup.controls.email;
  }

  get password() {
    return this.loginFormGroup.controls.password;
  }

  get isLoading() {
    return this.submitting || this.redirecting;
  }

  async ngOnInit(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      await this.router.navigateByUrl('/main');
    }
  }

  async onSubmitForm() {
    this.loginFormGroup.markAllAsTouched();

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const { email, password } = this.loginFormGroup.getRawValue();

    try {
      const res = await this.accountService.loginPost$JsonAsync({
        body: { email: email!, password: password! },
      });

      this.authService.setToken(res.accessToken);
      this.notificationsService.connect();
      void this.notificationsService.refresh();
      this.toastService.open('You successfully logged in ✨', 'info');

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      await this.router.navigateByUrl('/main');
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        this.toastService.open(message, 'warning');
      } else if (error instanceof Error) {
        this.toastService.open(error.message, 'warning');
      }
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();
    }
  }
}
