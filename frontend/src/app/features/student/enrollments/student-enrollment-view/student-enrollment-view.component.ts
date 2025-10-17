import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZone } from '@angular/core';
import { ActivityDto, CourseDetailsDto } from '$backend/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type CPState = 'done' | 'ready' | 'locked';

@Component({
  selector: 'app-student-enrollment-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './student-enrollment-view.component.html',
  styleUrls: ['./student-enrollment-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentViewComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('roadPath', { static: true })
  roadPath!: ElementRef<SVGPathElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  @Input() course!: CourseDetailsDto;

  private courseReady = false;
  private svgReady = false;

  readonly roadD =
    'M 80 520 C 220 420, 540 560, 700 500 S 600 260, 420 260 S 220 200, 300 120';

  positions: Array<{
    x: number;
    y: number;
    idx: number;
    a: ActivityDto;
    state: CPState;
  }> = [];

  private resizeObs?: ResizeObserver;

  ngAfterViewInit(): void {
    this.svgReady = true;
    const svg = this.svgRef.nativeElement;

    if ('ResizeObserver' in window) {
      this.resizeObs = new ResizeObserver(() => this.safeComputeWithRetry());
      this.resizeObs.observe(svg);
    }

    if (this.course) {
      this.courseReady = true;
      this.safeComputeWithRetry();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('course' in changes) {
      this.courseReady = !!this.course && !!this.course.activities?.length;

      if (this.svgReady && this.courseReady) {
        this.safeComputeWithRetry();
      } else if (!this.courseReady) {
        this.zone.run(() => {
          this.positions = [];
          this.cdr.markForCheck();
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
  }

  trackById = (_: number, cp: any) => cp.a.id;

  private safeComputeWithRetry(maxRetries = 6) {
    if (!this.courseReady || !this.svgReady) {
      return;
    }

    let tries = 0;

    const attempt = () => {
      const ok = this.tryComputeOnce();

      if (!ok && tries < maxRetries) {
        tries++;
        requestAnimationFrame(attempt);
      }
    };

    requestAnimationFrame(attempt);
  }

  private tryComputeOnce(): boolean {
    if (!this.course?.activities?.length || !this.roadPath?.nativeElement) {
      this.zone.run(() => {
        this.positions = [];
        this.cdr.markForCheck();
      });

      return true;
    }

    const path = this.roadPath.nativeElement;
    const d = path.getAttribute('d') || '';

    if (!d.trim()) {
      return false;
    }

    let L = 0;

    try {
      L = path.getTotalLength();
    } catch {
      L = 0;
    }

    if (!isFinite(L) || L <= 0) {
      return false;
    }

    const acts = this.course.activities;
    const steps = Math.min(acts.length, 10);
    const unlockedIdx = this.getUnlockedIndex(acts);

    const newPos: typeof this.positions = [];

    for (let i = 0; i < steps; i++) {
      const t = steps === 1 ? 0.05 : i / (steps - 1);
      const pt = path.getPointAtLength(t * L);
      const completed =
        (acts[i] as any).completed ??
        (acts[i] as any).isCompleted ??
        (acts[i] as any).done ??
        false;
      const state: CPState = completed
        ? 'done'
        : i <= unlockedIdx
          ? 'ready'
          : 'locked';
      newPos.push({ x: pt.x, y: pt.y, idx: i, a: acts[i], state });
    }

    this.zone.run(() => {
      this.positions = newPos;
      this.cdr.markForCheck();
    });
    return true;
  }

  private getUnlockedIndex(acts: ActivityDto[]) {
    const lastDone = Math.max(
      -1,
      ...acts.map((a, i) => {
        const c =
          (a as any).completed ??
          (a as any).isCompleted ??
          (a as any).done ??
          false;
        return c ? i : -1;
      })
    );
    return Math.min(lastDone + 1, acts.length - 1);
  }
}
