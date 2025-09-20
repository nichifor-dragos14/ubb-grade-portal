import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '$backend/services';
import { AuthService } from '../../auth/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  private formBuilder = inject(FormBuilder);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  async ngOnInit(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      await this.router.navigateByUrl('/main');
    }
  }

  async onSubmitForm() {
    this.loginFormGroup.markAllAsTouched();

    if (this.loginFormGroup.invalid || this.submitting || this.redirecting) {
      return;
    }

    this.submitting = true;

    const { email, password } = this.loginFormGroup.getRawValue();

    try {
      const res = await this.accountService.loginPost$JsonAsync({
        body: { email: email!, password: password! },
      });

      this.authService.setToken(res.accessToken);

      this.submitting = false;
      this.redirecting = true;

      await this.router.navigateByUrl('/main');
    } finally {
      this.submitting = false;
      this.redirecting = false;
    }
  }
}
