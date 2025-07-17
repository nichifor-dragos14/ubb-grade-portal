import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogContentComponent } from './dialog-content.component';

@Injectable({
  providedIn: 'root',
})
export class AppDialogService {
  readonly matDialog = inject(MatDialog);

  open(message: string, OnConfirmParam?: () => void) {
    const matDialogRef = this.matDialog.open(DialogContentComponent, {
      data: {
        content: message,
        OnConfirm: OnConfirmParam,
      },
    });

    matDialogRef.afterClosed().subscribe();
  }
}
