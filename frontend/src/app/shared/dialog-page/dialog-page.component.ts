import {
  Component,
  TemplateRef,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-page',
  template: ` <ng-template><router-outlet /></ng-template> `,
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPageComponent implements OnInit, OnDestroy {
  matDialog = inject(MatDialog);
  router = inject(Router);
  route = inject(ActivatedRoute);

  @ViewChild(TemplateRef, { static: true })
  template!: TemplateRef<void>;

  dialogRef: MatDialogRef<void> | null = null;

  ngOnInit() {
    this.dialogRef = this.matDialog.open(this.template, {
      closeOnNavigation: true,
      hasBackdrop: true,
    });

    this.dialogRef.backdropClick().subscribe(() => {
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }

  ngOnDestroy() {
    this.dialogRef?.close();
  }
}
