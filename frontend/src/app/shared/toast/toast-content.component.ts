import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, interval, map, switchMap, take, tap } from 'rxjs';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [CommonModule, MatProgressBarModule, MatIconModule, MatButtonModule],
  styles: `
      section {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 4px 8px;
      }
      
      span {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
   `,
  template: `
    <section>
      @switch (type) {
        @case ('info') {
          <mat-icon>announcement</mat-icon>
        }
        @case ('error') {
          <mat-icon>cancel</mat-icon>
        }
        @case ('warning') {
          <mat-icon>warning</mat-icon>
        }
      }
      <span id="content">
        <span>{{ content }}</span>
        <a mat-icon-button color="accent" (click)="close()">
          <mat-icon>close</mat-icon>
        </a>
      </span>
    </section>

    <mat-progress-bar [value]="countDown | async" color="accent" />
  `,
  standalone: true,
  selector: 'app-toast-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContentComponent {
  @Input() content = '';
  @Input() type: 'info' | 'error' | 'warning' = 'info';

  readonly snackBarRef = inject(MatSnackBarRef);
  readonly isHovering = new BehaviorSubject(false);
  readonly countDown = this.isHovering.pipe(
    switchMap((pause) => {
      if (pause) return [];

      return interval(50);
    }),
    map((_, tick) => 100 - (tick + 1)),
    tap((countDown) => {
      if (countDown <= 0) {
        this.snackBarRef.dismiss();
      }
    }),
    take(100)
  );

  @HostListener('mouseenter', ['$event'])
  onEnter() {
    this.isHovering.next(true);
  }

  @HostListener('mouseleave', ['$event'])
  onLeave() {
    this.isHovering.next(false);
  }

  close() {
    this.snackBarRef.dismiss();
  }
}
