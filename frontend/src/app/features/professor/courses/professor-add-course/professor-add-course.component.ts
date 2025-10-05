import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

import { CourseDomainDto, CourseService } from '$backend/services';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ProfessorCoursesEventService } from '../professor-courses-event.service';
import { AppToastService } from '$shared/toast';

@Component({
  selector: 'app-professor-add-course',
  templateUrl: './professor-add-course.component.html',
  styleUrls: ['./professor-add-course.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatSelectModule,
    CommonModule,
    MatProgressSpinner,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddCourseComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly toastService = inject(AppToastService);
  private readonly courseService = inject(CourseService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  addCourseFormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
    courseDomainId: ['', Validators.required],
  });

  courseDomains: CourseDomainDto[] = [];

  loadingDomains = false;
  submitting = false;
  redirecting = false;

  get isLoading(): boolean {
    return this.loadingDomains || this.submitting || this.redirecting;
  }

  get name() {
    return this.addCourseFormGroup.controls.name;
  }

  get courseDomainId() {
    return this.addCourseFormGroup.controls.courseDomainId;
  }

  async ngOnInit() {
    this.loadingDomains = true;
    this.cdr.detectChanges();

    try {
      this.courseDomains = await this.courseService.apiCourseDomainsGetAsync();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }

      this.courseDomains = [];
      this.cdr.detectChanges();
    } finally {
      this.loadingDomains = false;
      this.cdr.detectChanges();
    }
  }

  async createCourse() {
    this.addCourseFormGroup.markAllAsTouched();

    const courseDomainId =
      this.addCourseFormGroup.controls.courseDomainId.value?.toString();
    const name = this.addCourseFormGroup.controls.name.value;
    const description = this.addCourseFormGroup.controls.description.value;

    if (courseDomainId == null || name == null || description == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      var courseId = await this.courseService.apiCoursePostAsync({
        body: {
          name: name,
          description: description,
          courseDomainId: courseDomainId,
        },
      });

      this.professorCoursesEventService.emitCreatedCourse({
        courseId: courseId,
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      this.toastService.open(`Successfully created ${name}`);

      await this.router.navigate(['..', courseId], {
        relativeTo: this.activatedRoute,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();
    }
  }
}
