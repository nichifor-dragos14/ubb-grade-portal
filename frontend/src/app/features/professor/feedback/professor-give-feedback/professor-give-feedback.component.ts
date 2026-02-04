import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { SolvedActivityDto, SolvedActivityStatus } from '$backend/services';
import { AppToastService } from '$shared/toast';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { DateConverterModule } from '$shared/date-converter';

@Component({
  selector: 'app-professor-give-feedback',
  standalone: true,
  templateUrl: './professor-give-feedback.component.html',
  styleUrls: ['./professor-give-feedback.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinner,
    MatIconModule,
    DocumentViewerComponent,
    DateConverterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorGiveFeedbackComponent implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(AppToastService);

  @Input() solvedActivity?: SolvedActivityDto;

  submitting = false;
  loading = false;

  feedbackForm = this.formBuilder.group({
    grade: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(10)],
    ],
    professorComment: [''],
  });

  get isLoading(): boolean {
    return this.submitting || this.loading;
  }

  get grade() {
    return this.feedbackForm.controls.grade;
  }

  get professorComment() {
    return this.feedbackForm.controls.professorComment;
  }

  get canGrade(): boolean {
    return !!this.solvedActivity && this.feedbackForm.valid;
  }

  get canReturn(): boolean {
    return !!this.solvedActivity;
  }

  get submittedOn(): string | null | undefined {
    return this.solvedActivity?.updatedOn || this.solvedActivity?.createdOn;
  }

  get submitterName(): string {
    return this.solvedActivity?.solvedByName || 'Unknown student';
  }

  get statusLabel(): string {
    switch (this.solvedActivity?.status) {
      case SolvedActivityStatus.$0:
        return 'Submitted';
      case SolvedActivityStatus.$1:
        return 'Completed';
      case SolvedActivityStatus.$2:
        return 'Returned';
      default:
        return 'Unknown';
    }
  }

  get submissionDocuments() {
    return ((this.solvedActivity as any)?.documents ?? []) as any[];
  }

  async ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras
      ?.state as unknown as {
      solvedActivity?: SolvedActivityDto;
    };

    const resolved = this.activatedRoute.snapshot.data['solvedActivity'] as
      | SolvedActivityDto
      | undefined;

    // this.solvedActivity = resolved ?? state?.solvedActivity;

    if (this.solvedActivity?.grade) {
      this.feedbackForm.patchValue({ grade: this.solvedActivity.grade });
    }

    this.cdr.markForCheck();
  }

  async gradeActivity() {
    if (!this.solvedActivity) {
      return;
    }

    this.feedbackForm.markAllAsTouched();

    if (!this.feedbackForm.valid) {
      return;
    }

    const grade = this.grade.value ?? null;
    const professorComment = this.professorComment.value ?? '';

    try {
      this.submitting = true;
      this.cdr.detectChanges();

      // TODO: wire to professor feedback endpoint once available in codegen.
      await Promise.resolve();

      this.toastService.open('Feedback saved', 'info');
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  async returnActivity() {
    if (!this.solvedActivity) {
      return;
    }

    const professorComment = this.professorComment.value ?? '';

    try {
      this.submitting = true;
      this.cdr.detectChanges();

      // TODO: wire to professor feedback endpoint once available in codegen.
      await Promise.resolve();

      this.toastService.open('Submission returned to student', 'info');
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  async close() {
    await this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
