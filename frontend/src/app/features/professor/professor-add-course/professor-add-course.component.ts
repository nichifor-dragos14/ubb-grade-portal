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
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

import { CourseDomainDto, CourseService } from '$backend/services';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
    MatSlideToggleModule,
    CommonModule,
    MatProgressSpinner,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddCourseComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private courseService = inject(CourseService);

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

  async createCourse() {
    this.addCourseFormGroup.markAllAsTouched();

    const courseDomainId =
      this.addCourseFormGroup.controls.courseDomainId.value?.toString();
    const name = this.addCourseFormGroup.controls.name.value;
    const description = this.addCourseFormGroup.controls.description.value;

    if (courseDomainId == null || name == null || description == null) {
      return;
    }

    if (this.submitting || this.redirecting) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      await this.courseService.apiCoursePostAsync({
        body: {
          name: name,
          description: description,
          courseDomainId: courseDomainId,
        },
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      await this.router.navigateByUrl('/main/professor/courses');
    } catch (message: any) {
      this.snackBar.open(message.error, 'Close', {
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
