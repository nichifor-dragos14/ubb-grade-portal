import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  template: `
    <h2 mat-dialog-title>{{ data.content }}</h2>

    <div mat-dialog-actions>
      <button mat-button (click)="onConfirmClick()">Confirm</button>
      <button mat-button (click)="onNoClick()">Cancel</button>
    </div>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-dialog-content',
})
export class DialogContentComponent {
  @Input() content = '';

  readonly dialogRef = inject(MatDialogRef<DialogContentComponent>);
  data = inject(MAT_DIALOG_DATA);

  onNoClick(): void {
    this.dialogRef.close();
  }

  onConfirmClick(): void {
    this.data.OnConfirm();
    this.onNoClick();
  }
}
