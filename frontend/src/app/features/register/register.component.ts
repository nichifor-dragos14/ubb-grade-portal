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
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
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
import { AppToastService } from '$shared/toast';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly courseService = inject(CourseService);
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(AppToastService);

  courseDomains: CourseDomainDto[] = [];
  courses: CourseDto[] = [];

  loadingDomains = false;
  loadingCourses = false;
  loadingRecommendations = false;
  submitting = false;
  redirecting = false;
  showRecommendationsNote = false;

  hide = true;
  activeTabIndex = 0;

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
    csInterest: [''],
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
      this.loadingRecommendations ||
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

  get hasInterestPhrase(): boolean {
    return !!this.personalInformationFormGroup.controls.csInterest.value?.trim();
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated()) {
      await this.router.navigateByUrl('/main');

      return;
    }
  }

  async onStepChange(event: MatTabChangeEvent) {
    this.activeTabIndex = event.index;

    if (event.index !== 1) {
      return;
    }
    await this.loadCourseDomains();
    await this.loadRecommendations();
  }

  onPreviousTab() {
    if (this.activeTabIndex > 0) {
      this.activeTabIndex -= 1;
    }
  }

  onNextTab() {
    if (this.activeTabIndex < 3) {
      this.activeTabIndex += 1;
    }
  }

  async onCourseDomainsSelectionChange() {
    const courseDomainIds =
      this.courseDomainFormGroup.controls.courseDomains.value;

    if (courseDomainIds == null || courseDomainIds.length === 0) {
      this.courses = [];
      this.cdr.detectChanges();

      return;
    }

    if (
      this.loadingCourses ||
      this.loadingDomains ||
      this.submitting ||
      this.redirecting
    ) {
      return;
    }

    this.loadingCourses = true;
    this.cdr.detectChanges();

    try {
      this.courses = await this.courseService.apiCourseGetAsync({
        courseDomainIds: courseDomainIds,
      });

      if (this.pendingCourseIds.length) {
        const availableIds = new Set(this.courses.map((course) => course.id));
        const selectedCourses = this.pendingCourseIds.filter((id) =>
          availableIds.has(id)
        );
        this.courseFormGroup.controls.courses.setValue(selectedCourses);
        this.courseFormGroup.markAsDirty();
        this.pendingCourseIds = [];
      }
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'warning');
      }

      this.courseDomains = [];
    } finally {
      this.loadingCourses = false;
      this.cdr.detectChanges();
    }
  }

  private domainsLoaded = false;
  private recommendationsLoaded = false;
  private pendingCourseIds: string[] = [];

  private async loadCourseDomains() {
    if (this.domainsLoaded || this.loadingDomains) {
      return;
    }

    this.loadingDomains = true;
    this.cdr.detectChanges();

    try {
      this.courseDomains = await this.courseService.apiCourseDomainsGetAsync();
      this.domainsLoaded = true;
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'warning');
      }
    } finally {
      this.loadingDomains = false;
      this.cdr.detectChanges();
    }
  }

  private async loadRecommendations() {
    if (this.recommendationsLoaded || this.loadingRecommendations) {
      return;
    }

    const phrase =
      this.personalInformationFormGroup.controls.csInterest.value?.trim() || '';

    if (!phrase) {
      this.showRecommendationsNote = false;
      return;
    }

    this.loadingRecommendations = true;
    this.cdr.detectChanges();

    try {
      const recommendations =
        await this.courseService.apiCourseRecommendationsPostAsync({
          body: { phrase: phrase },
        });

      const domainIds = (recommendations?.courseDomainIds ?? []).map(
        (id: string) => id.toString()
      );
      const courseIds = (recommendations?.courseIds ?? []).map((id: string) =>
        id.toString()
      );

      this.showRecommendationsNote =
        domainIds.length > 0 || courseIds.length > 0;

      this.pendingCourseIds = courseIds;

      if (domainIds.length) {
        this.courseDomainFormGroup.controls.courseDomains.setValue(domainIds);
        await this.onCourseDomainsSelectionChange();
      }

      this.recommendationsLoaded = true;
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'warning');
      }
    } finally {
      this.loadingRecommendations = false;
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

    if (this.isLoading) {
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
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const message =
          typeof error.error === 'string' ? error.error : error.message;
        const formatted = message
          .split(';')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
          .join(' ');
        this.toastService.open(formatted, 'warning');
      }
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();
    }
  }
}
