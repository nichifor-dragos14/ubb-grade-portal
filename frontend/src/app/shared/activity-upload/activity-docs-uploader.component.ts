// src/app/components/activity-docs-uploader/activity-docs-uploader.component.ts
import { Component, inject, Input } from '@angular/core';
import { ActivityDocsService } from './activity-docs.service';

@Component({
  selector: 'app-activity-docs-uploader',
  template: `
    <div>
      <input type="file" (change)="onFilesSelected($event)" multiple />

      <div *ngIf="isUploading">Uploading…</div>
      <div *ngIf="lastError" style="color: #c00;">{{ lastError }}</div>
    </div>
  `,
})
export class ActivityDocsUploaderComponent {
  @Input({ required: true }) activityId!: string;
  @Input() tenantId: string = 'default';

  isUploading = false;
  lastError: string | null = null;

  private activityDocsService = inject(ActivityDocsService);

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length === 0) {
      return;
    }

    this.isUploading = true;
    this.lastError = null;

    try {
      await this.activityDocsService.uploadManyAndLinkAsync(
        this.activityId,
        this.tenantId,
        files
      );
    } catch (error: any) {
      this.lastError = error?.message ?? 'Upload failed';
    } finally {
      this.isUploading = false;
      input.value = '';
    }
  }
}
