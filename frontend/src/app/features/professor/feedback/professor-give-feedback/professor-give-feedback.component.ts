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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import {
  SolvedActivityDto,
  SolvedActivityService,
  SolvedActivityStatus,
} from '$backend/services';
import { AppToastService } from '$shared/toast';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { DateConverterModule } from '$shared/date-converter';
import {
  ConfirmActionDialog,
  ConfirmActionDialogData,
} from '$shared/dialogs/confirm-action-dialog.component';
import { ProfessorFeedbackEventService } from '../professor-feedback-event.service';

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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinner,
    MatIconModule,
    MatTooltipModule,
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
  private readonly solvedActivityService = inject(SolvedActivityService);
  private readonly dialog = inject(MatDialog);
  private readonly professorFeedbackEventService = inject(
    ProfessorFeedbackEventService
  );

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
    const gradeValue = this.grade.value;
    return (
      !!this.solvedActivity &&
      gradeValue !== null &&
      gradeValue !== undefined &&
      this.feedbackForm.valid
    );
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

  get isCompleted(): boolean {
    return this.solvedActivity?.status === SolvedActivityStatus.$1;
  }

  get isReturned(): boolean {
    return this.solvedActivity?.status === SolvedActivityStatus.$2;
  }

  get professorCommentValue(): string {
    return this.solvedActivity?.professorComment?.trim() || '';
  }

  get statusClass(): string {
    switch (this.solvedActivity?.status) {
      case SolvedActivityStatus.$0:
        return 'status-submitted';
      case SolvedActivityStatus.$1:
        return 'status-completed';
      case SolvedActivityStatus.$2:
        return 'status-returned';
      default:
        return '';
    }
  }

  get isReadOnly(): boolean {
    return (
      this.solvedActivity?.status === SolvedActivityStatus.$1 ||
      this.solvedActivity?.status === SolvedActivityStatus.$2
    );
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

  private async confirmAction(data: ConfirmActionDialogData): Promise<boolean> {
    const ref = this.dialog.open(ConfirmActionDialog, {
      data,
      disableClose: true,
      width: '520px',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  async gradeActivity() {
    if (!this.solvedActivity) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.feedbackForm.markAllAsTouched();

    if (!this.feedbackForm.valid) {
      return;
    }

    const grade = this.grade.value ?? null;
    const professorComment = this.professorComment.value ?? '';
    const hasComment = professorComment.trim().length > 0;
    const studentName = this.submitterName;
    const activityName = this.solvedActivity.activity?.name ?? 'this activity';

    if (grade === null || grade === undefined) {
      return;
    }

    const confirmed = await this.confirmAction({
      title: 'Confirm grading',
      message: `Are you sure you want to grade ${studentName}'s submission for ${activityName} with ${grade}?${
        hasComment
          ? ''
          : ' Please consider leaving any remarks you might have regarding the submission.'
      }`,
      confirmText: 'Grade',
      cancelText: 'Cancel',
      icon: 'grading',
    });

    if (!confirmed) {
      return;
    }

    try {
      this.submitting = true;
      this.cdr.detectChanges();

      await this.solvedActivityService.apiSolvedActivityIdEvaluatePutAsync({
        id: this.solvedActivity.id,
        body: {
          status: SolvedActivityStatus.$1,
          grade: grade,
          professorComment: professorComment,
        },
      });

      this.solvedActivity = {
        ...this.solvedActivity,
        status: SolvedActivityStatus.$1,
        grade: grade,
        professorComment: professorComment,
      };

      this.professorFeedbackEventService.emitGradedSolvedActivity({
        solvedActivityId: this.solvedActivity!.id,
      });

      await this.router.navigate(['../'], { relativeTo: this.activatedRoute });
      this.toastService.open('The activity was graded', 'info');
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

    if (this.isLoading) {
      return;
    }

    const professorComment = this.professorComment.value ?? '';
    const hasComment = professorComment.trim().length > 0;
    const studentName = this.submitterName;
    const activityName = this.solvedActivity.activity?.name ?? 'this activity';

    const confirmed = await this.confirmAction({
      title: 'Confirm return',
      message: `Are you sure you want to return ${studentName}'s submission for ${activityName}?${
        hasComment
          ? ''
          : ' Please consider leaving any remarks you might have in order to guide the student for their future submission.'
      }`,
      confirmText: 'Return',
      cancelText: 'Cancel',
      icon: 'assignment_return',
      confirmColor: 'warn',
    });

    if (!confirmed) {
      return;
    }

    try {
      this.submitting = true;
      this.cdr.detectChanges();

      await this.solvedActivityService.apiSolvedActivityIdEvaluatePutAsync({
        id: this.solvedActivity.id,
        body: {
          status: SolvedActivityStatus.$2,
          grade: 0,
          professorComment: professorComment,
        },
      });

      this.solvedActivity = {
        ...this.solvedActivity,
        status: SolvedActivityStatus.$2,
        grade: 0,
        professorComment: professorComment,
      };

      this.toastService.open(
        'The activity was returned to the student',
        'info'
      );
      this.professorFeedbackEventService.emitGradedSolvedActivity({
        solvedActivityId: this.solvedActivity!.id,
      });
      await this.router.navigate(['../'], { relativeTo: this.activatedRoute });
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
