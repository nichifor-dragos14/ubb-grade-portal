import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import { ActivityDetailsDto, ActivityService } from '$backend/services';
import { SubmissionDocsDropzoneComponent } from '$shared/submission-upload/submission-docs-uploader.component';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { AppToastService } from '$shared/toast';

@Component({
  selector: 'app-solve-activity',
  standalone: true,
  template: `
    <app-page-header title="Solve '{{ activity?.name }}' 🧩">
      <button mat-button color="primary" (click)="done()" button>SUBMIT</button>
      <button mat-button color="warn" routerLink="../../../" button>
        CLOSE
      </button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <div *ngIf="!isLoading && activity" class="content">
      <p *ngIf="activity.description">{{ activity.description }}</p>

      <app-document-viewer [documents]="activity.activityDocuments">
      </app-document-viewer>

      <app-submission-docs-dropzone
        #dropzone
        [solvedActivityId]="activity.id"
        [tenantId]="'default'"
        accept=".pdf, .doc, .docx, image/*, application/zip, application/x-zip-compressed"
        [maxSizeMB]="15"
        [multiple]="true"
      >
      </app-submission-docs-dropzone>
    </div>
  `,
  styles: [
    `
      :host {
        padding: 24px;
        width: 56vw;
        height: 64vh;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .form-loader {
        min-height: 50vh;
        display: grid;
        place-items: center;
      }
      .content {
        overflow: auto;
        padding: 0 12px;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
    `,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
    SubmissionDocsDropzoneComponent,
    DocumentViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolveActivityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly toast = inject(AppToastService);
  readonly activityService = inject(ActivityService);

  @ViewChild('dropzone')
  dropzone?: SubmissionDocsDropzoneComponent;

  activity: ActivityDetailsDto | null = null;
  loading = false;

  get isLoading() {
    return this.loading;
  }

  async ngOnInit(): Promise<void> {
    const data = this.route.snapshot.data as { activity?: ActivityDetailsDto };

    if (data.activity) {
      this.activity = data.activity;

      return;
    }

    const id = this.route.snapshot.params['id'];

    if (!id) {
      return;
    }

    try {
      this.loading = true;
      this.activity = await this.activityService.apiActivityIdGetAsync({ id });
    } catch (err) {
      this.toast.open(
        (err as Error)?.message ?? 'Failed to load activity',
        'error'
      );

      await this.router.navigate(['../../../'], { relativeTo: this.route });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async done() {
    try {
      const solvedId = await this.dropzone?.submitAll?.();

      if (solvedId) {
        this.toast.open(`Submission saved`, 'info');
      } else {
        this.toast.open(`No files submitted`, 'info');
      }

      await this.router.navigate(['../../../'], { relativeTo: this.route });
    } catch (e: any) {
      this.toast.open(e?.message || 'Submit failed', 'error');
    }
  }
}
