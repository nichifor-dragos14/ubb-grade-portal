import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { DateConverterModule } from '$shared/date-converter';
import {
  ActivityService,
  PaginatedProfessorSolvedActivityDto,
  SolvedActivityDto,
  SolvedActivityService,
  SolvedActivityStatus,
} from '$backend/services';
import { ProfessorCoursesEventService } from '$features/professor/courses/professor-courses-event.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfessorFeedbackEventService } from '../professor-feedback-event.service';

@Component({
  selector: 'app-professor-activity-feedback',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    AppPageHeaderComponent,
    DateConverterModule,
  ],
  templateUrl: './professor-activity-feedback.component.html',
  styleUrl: './professor-activity-feedback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorActivityFeedbackComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly solvedActivityService = inject(SolvedActivityService);
  private readonly professorFeedbackEventService = inject(
    ProfessorFeedbackEventService
  );

  solvedActivities: SolvedActivityDto[] = [];
  totalCount = 0;

  pageIndex = 0;
  pageSize = 6;

  statusFilter: SolvedActivityStatus = SolvedActivityStatus.$0;

  isLoading = false;

  readonly statusOptions = [
    { value: SolvedActivityStatus.$0, label: 'Submitted' },
    { value: SolvedActivityStatus.$2, label: 'Returned' },
    { value: SolvedActivityStatus.$1, label: 'Completed' },
  ];

  async ngOnInit() {
    this.professorFeedbackEventService.gradedSolvedActivity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        console.log('Received gradedSolvedActivity event');
        this.loadPage();
      });

    await this.loadPage();
  }

  async onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    await this.loadPage();
  }

  async onStatusChange(value: SolvedActivityStatus) {
    this.statusFilter = value;
    this.pageIndex = 0;

    await this.loadPage();
  }

  getStatusLabel(status?: SolvedActivityStatus) {
    switch (status) {
      case SolvedActivityStatus.$0:
        return 'Submitted';
      case SolvedActivityStatus.$1:
        return 'Completed';
      case SolvedActivityStatus.$2:
        return 'Returned';
      default:
        return 'Status unknown';
    }
  }

  getStatusClass(status?: SolvedActivityStatus) {
    switch (status) {
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

  getSubmittedOn(solvedActivity: SolvedActivityDto) {
    return solvedActivity.updatedOn || solvedActivity.createdOn;
  }

  getSubmitterName(solvedActivity: SolvedActivityDto) {
    return solvedActivity?.solvedByName || 'Unknown student';
  }

  private async loadPage() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result: PaginatedProfessorSolvedActivityDto =
        await this.solvedActivityService.apiSolvedActivityProfessorGetAsync({
          pageNumber: this.pageIndex + 1,
          pageSize: this.pageSize,
          status: this.statusFilter,
        });

      this.solvedActivities = result.solvedActivities ?? [];
      this.totalCount = result.count ?? 0;
      this.cdr.detectChanges();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
