import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  AccountService,
  CourseDomainDto,
  CourseDto,
  CourseService,
} from '$backend/services';
import { AuthService } from '../../core/auth/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  private courseService = inject(CourseService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);

  courseDomains: CourseDomainDto[] = [];
  courses: CourseDto[] = [];

  loadingDomains = false;
  loadingCourses = false;
  submitting = false;
  redirecting = false;

  hide = true;

  personalInformationFormGroup = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
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

  courseDomainFormGroup = this.formBuilder.group({
    courseDomains: this.formBuilder.control<string[]>([], {
      validators: [Validators.required],
    }),
  });

  courseFormGroup = this.formBuilder.group({
    courses: this.formBuilder.control<string[]>([], {
      validators: [Validators.required],
    }),
  });

  get isLoading(): boolean {
    return (
      this.loadingDomains ||
      this.loadingCourses ||
      this.submitting ||
      this.redirecting
    );
  }

  get password() {
    return this.personalInformationFormGroup.controls.password;
  }

  get email() {
    return this.personalInformationFormGroup.controls.email;
  }

  get firstName() {
    return this.personalInformationFormGroup.controls.firstName;
  }

  get lastName() {
    return this.personalInformationFormGroup.controls.lastName;
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated()) {
      await this.router.navigateByUrl('/main');

      return;
    }

    this.loadingDomains = true;
    this.cdr.detectChanges();

    try {
      this.courseDomains = await this.courseService.apiCourseDomainsGetAsync();
    } catch {
      this.snackBar.open(
        'Something went wrong while searching for subject areas.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
      this.courseDomains = [];
    } finally {
      this.loadingDomains = false;
      this.cdr.detectChanges();
    }
  }

  async onCourseDomainsSelectionChange() {
    const courseDomainIds =
      this.courseDomainFormGroup.controls.courseDomains.value;

    if (courseDomainIds == null || courseDomainIds.length === 0) {
      this.courses = [];
      this.loadingCourses = false;
      this.cdr.detectChanges();

      return;
    }

    this.loadingCourses = true;
    this.cdr.detectChanges();

    try {
      this.courses = await this.courseService.apiCourseGetAsync({
        courseDomainIds: courseDomainIds,
      });
    } catch (message: any) {
      this.snackBar.open(
        'Something went wrong while searching for courses.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
      this.courseDomains = [];
    } finally {
      this.loadingCourses = false;
      this.cdr.detectChanges();
    }
  }

  async onSubmitForm() {
    this.personalInformationFormGroup.markAllAsTouched();
    this.courseDomainFormGroup.markAllAsTouched();
    this.courseFormGroup.markAllAsTouched();

    const courseIds = this.courseFormGroup.controls.courses.value;
    const email = this.personalInformationFormGroup.controls.email.value;
    const firstName =
      this.personalInformationFormGroup.controls.firstName.value;
    const lastName = this.personalInformationFormGroup.controls.lastName.value;
    const password = this.personalInformationFormGroup.controls.password.value;

    if (courseIds == null || courseIds.length === 0) {
      return;
    }

    if (
      email == null ||
      firstName == null ||
      lastName == null ||
      password == null
    ) {
      return;
    }

    const studentRole = 0;

    if (this.submitting || this.redirecting) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      await this.accountService.registerPost$JsonAsync({
        body: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          password: password,
          courseIds: courseIds,
          role: studentRole,
        },
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      await this.router.navigateByUrl('/main');
    } catch (message: any) {
      var errors = message.error.split(';');
      this.snackBar.open(errors[1], 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();
    }
  }
}
