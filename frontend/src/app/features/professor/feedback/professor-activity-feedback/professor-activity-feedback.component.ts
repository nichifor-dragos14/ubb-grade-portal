import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
  SolvedActivityDetailsDto,
  SolvedActivityProfessorDetailsDto,
  SolvedActivityStatus,
} from '$backend/services';

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
  private readonly activityService = inject(ActivityService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(AppToastService);

  solvedActivities: SolvedActivityProfessorDetailsDto[] = [];
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

  getStatusLabel(status: SolvedActivityStatus): string {
    switch (status) {
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

  getStatusClass(status: SolvedActivityStatus): string {
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

  getSubmittedOn(
    item: SolvedActivityProfessorDetailsDto
  ): string | null | undefined {
    return item.updatedOn || item.createdOn;
  }

  getSubmitterName(item: SolvedActivityProfessorDetailsDto): string {
    return item?.solvedByName || 'Unknown student';
  }

  private async loadPage() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result: PaginatedProfessorSolvedActivityDto =
        await this.activityService.apiActivitySolvedProfessorGetAsync({
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
