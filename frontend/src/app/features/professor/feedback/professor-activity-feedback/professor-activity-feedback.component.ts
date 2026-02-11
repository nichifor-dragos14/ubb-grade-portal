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
import { MatInputModule } from '@angular/material/input';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { DateConverterModule } from '$shared/date-converter';
import {
  PaginatedProfessorSolvedActivityDto,
  SolvedActivityDto,
  SolvedActivityService,
  SolvedActivityStatus,
  SolvedActivityStatusFilter,
} from '$backend/services';
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
    MatInputModule,
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

  studentNameFilter = '';
  private studentNameTimer?: ReturnType<typeof setTimeout>;

  statusFilter: SolvedActivityStatusFilter = SolvedActivityStatusFilter.$0;
  filtersOpen = false;

  isLoading = false;

  readonly statusOptions = [
    { value: SolvedActivityStatusFilter.$0, label: 'Submitted' },
    { value: SolvedActivityStatusFilter.$1, label: 'Completed' },
    { value: SolvedActivityStatusFilter.$2, label: 'Returned' },
    { value: SolvedActivityStatusFilter.$3, label: 'All' },
  ];

  async ngOnInit() {
    this.professorFeedbackEventService.gradedSolvedActivity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        await this.loadPage();
      });

    await this.loadPage();
  }

  async onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    await this.loadPage();
  }

  async onStatusChange(value: SolvedActivityStatusFilter) {
    this.statusFilter = value;
    this.pageIndex = 0;

    await this.loadPage();
  }

  onStudentNameInput(value: string) {
    this.studentNameFilter = value;
    this.pageIndex = 0;

    if (this.studentNameTimer) {
      clearTimeout(this.studentNameTimer);
    }

    this.studentNameTimer = setTimeout(() => {
      this.loadPage();
    }, 400);
  }

  toggleFilters() {
    this.filtersOpen = !this.filtersOpen;
    this.cdr.markForCheck();
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

  getStatusFilterLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.statusFilter)
        ?.label ?? 'Selected'
    );
  }

  getEmptySubtitle(): string {
    if (this.getStatusFilterLabel() === 'All') {
      return 'No submissions yet.';
    }

    return `No submissions matching status ${this.getStatusFilterLabel()} and search "${this.studentNameFilter}" yet.`;
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
          studentName: this.studentNameFilter.trim() || undefined,
        } as any);

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
