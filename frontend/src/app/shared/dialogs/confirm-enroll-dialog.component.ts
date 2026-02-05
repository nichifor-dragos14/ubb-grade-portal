import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmEnrollDialogData {
  courseName: string;
}

@Component({
  selector: 'app-confirm-enroll-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-title-row">
        <mat-icon class="title-icon">help_outline</mat-icon>
        <h2 class="dialog-title">Enroll in course</h2>
      </div>

      <p class="dialog-message">
        Are you sure you want to enroll in '{{ data.courseName }}'?
      </p>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          Cancel
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          class="confirm-btn"
        >
          Enroll
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dialog-container {
        text-align: center;
        padding: 24px 32px;
      }

      .dialog-title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
      }

      .title-icon {
        color: #9aa0a6;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .dialog-title {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #202124;
      }

      .dialog-message {
        margin: 0 0 28px 0;
        font-size: 14px;
        color: #5f6368;
        line-height: 1.6;
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        padding-top: 8px;
      }

      .cancel-btn {
        min-width: 100px;
        color: #5f6368;
      }

      .confirm-btn {
        min-width: 100px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEnrollDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmEnrollDialogData,
    private dialogRef: MatDialogRef<ConfirmEnrollDialog>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
