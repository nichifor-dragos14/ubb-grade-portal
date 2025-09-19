import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { AccountService } from '$backend/services';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private _formBuilder = inject(FormBuilder);
  private _accountService = inject(AccountService);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  loginFormGroup = this._formBuilder.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  async onSubmitForm() {
    const email = this.loginFormGroup.controls.email.value;
    const password = this.loginFormGroup.controls.password.value;

    if (email == null || password == null) {
      return;
    }

    const token = await this._accountService.loginPost$JsonAsync({
      body: {
        email: email,
        password: password,
      },
    });

    this._authService.setToken(token.accessToken);
    this._router.navigateByUrl('/main');
  }
}
