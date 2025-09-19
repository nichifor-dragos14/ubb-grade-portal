import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import {
  AccountService,
  CourseDomainDto,
  CourseDto,
  CourseService,
} from '$backend/services';
import { finalize } from 'rxjs/operators';

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
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private courseService = inject(CourseService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  loadingDomains = false;
  loadingCourses = false;
  submitting = false;
  redirecting = false;

  activeIndex = 0;

  personalInformationFormGroup = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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

  courseDomains: CourseDomainDto[] = [];
  courses: CourseDto[] = [];

  @ViewChild('card', { static: true }) cardRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('stepBody') stepBodyRefs!: QueryList<
    ElementRef<HTMLDivElement>
  >;
  private resizeObserver?: ResizeObserver;

  async ngOnInit() {
    this.loadingDomains = true;

    this.courseService
      .apiCourseDomainsGet()
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.loadingDomains = false;
            this.recalculateCardHeight();
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (domains) => {
          this.courseDomains = domains;
        },
        error: () => {
          this.courseDomains = [];
        },
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.recalculateCardHeight(), 0);
    this.resizeObserver = new ResizeObserver(() =>
      this.recalculateCardHeight()
    );
    this.resizeObserver.observe(this.cardRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  onStepperChanged(event: StepperSelectionEvent): void {
    this.activeIndex = event.selectedIndex;
    this.recalculateCardHeight();
  }

  onDomainsSelectionChange(_e: MatSelectionListChange) {
    const courseDomainIds =
      this.courseDomainFormGroup.controls.courseDomains.value;

    if (courseDomainIds == null || courseDomainIds.length === 0) {
      this.courses = [];
      this.courseFormGroup.patchValue({ courses: [] });
      this.recalculateCardHeight();
      return;
    }

    this.loadingCourses = true;

    this.courseService
      .apiCourseGet({ courseDomainIds: courseDomainIds })
      .pipe(
        finalize(() => {
          // force change detection so the loader disappears immediately
          this.zone.run(() => {
            this.loadingCourses = false;
            this.recalculateCardHeight();
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (courses) => {
          this.courses = courses;

          const allowed = new Set(this.courses.map((c) => c.courseId));
          const current = this.courseFormGroup.controls.courses.value ?? [];
          const next = current.filter((id) => allowed.has(id));
          if (next.length !== current.length) {
            this.courseFormGroup.patchValue({ courses: next });
          }
        },
        error: () => {
          this.courses = [];
          this.courseFormGroup.patchValue({ courses: [] });
        },
      });
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
      await this.router.navigateByUrl('/main');
    } finally {
      this.submitting = false;
      this.redirecting = false;
    }
  }

  private recalculateCardHeight(): void {
    if (!this.cardRef || !this.stepBodyRefs || this.stepBodyRefs.length === 0) {
      return;
    }

    let maxBody = 0;
    this.stepBodyRefs.forEach((ref) => {
      const el = ref.nativeElement;
      maxBody = Math.max(maxBody, el.scrollHeight);
    });

    const chrome = 110; // header area only (footer is outside the scroll)
    const target = maxBody + chrome;

    const maxAllowed = Math.max(560, window.innerHeight - 140);
    const finalHeight = Math.min(Math.max(target, 580), maxAllowed);

    this.cardRef.nativeElement.style.setProperty(
      '--card-height',
      `${finalHeight}px`
    );
  }
}
