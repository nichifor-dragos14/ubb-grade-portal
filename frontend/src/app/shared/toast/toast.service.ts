import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastContentComponent } from './toast-content.component';

@Injectable({
  providedIn: 'root',
})
export class AppToastService {
  readonly matSnackBar = inject(MatSnackBar);

  open(message: string, type: 'info' | 'error' | 'warning' = 'error') {
    const matSnackBarRef = this.matSnackBar.openFromComponent(
      ToastContentComponent
    );
    const matSnackBarRefInstance = matSnackBarRef.instance;

    matSnackBarRefInstance.content = message;
    matSnackBarRefInstance.type = type;
  }
}
