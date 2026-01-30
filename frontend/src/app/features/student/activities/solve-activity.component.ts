import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { ActivityDocsDropzoneComponent } from '$shared/activity-upload/activity-docs-uploader.component';
import { ActivityDocsViewerComponent } from '$shared/activity-upload/activity-docs-viewer.component';
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

      <app-activity-docs-viewer [documents]="activity.activityDocuments">
      </app-activity-docs-viewer>

      <app-activity-docs-dropzone
        [activityId]="activity.id"
        [tenantId]="'default'"
        accept=".pdf, .doc, .docx, image/*, application/zip, application/x-zip-compressed"
        [maxSizeMB]="15"
        [multiple]="true"
      >
      </app-activity-docs-dropzone>
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
    ActivityDocsDropzoneComponent,
    ActivityDocsViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolveActivityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly toast = inject(AppToastService);
  readonly activityService = inject(ActivityService);

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

  done() {
    this.toast.open(
      `A new submission was added for ${this.activity?.name}`,
      'info'
    );
    void this.router.navigate(['../../../'], { relativeTo: this.route });
  }
}
