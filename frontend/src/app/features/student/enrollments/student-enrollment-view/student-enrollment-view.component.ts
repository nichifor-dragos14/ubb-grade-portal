import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data } from '@angular/router';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { ActivityDto, CourseDetailsDto } from '$backend/services';
import { NgZone } from '@angular/core';

type CPState = 'done' | 'ready' | 'locked';

@Component({
  selector: 'app-student-enrollment-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-enrollment-view.component.html',
  styleUrls: ['./student-enrollment-view.component.scss'],
})
export class StudentEnrollmentViewComponent
  implements AfterViewInit, OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('roadPath', { static: true })
  roadPath!: ElementRef<SVGPathElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  @Input() course!: CourseDetailsDto;
  private courseReady = false;
  private svgReady = false;

  // Tighter, smoother curve (you can tweak freely)
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

    // resolver data
    this.route.data
      .pipe(
        takeUntil(this.destroy$),
        filter((d: Data) => !!d['course']),
        map((d: Data) => d['course'] as CourseDetailsDto)
      )
      .subscribe((course) => {
        this.course = course;
        this.courseReady = true;
        this.safeComputeWithRetry();
      });

    this.safeComputeWithRetry();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObs?.disconnect();
  }

  trackById = (_: number, cp: any) => cp.a.id;

  // ---- robust scheduling (prevents "path is empty" crash) ----
  private safeComputeWithRetry(maxRetries = 6) {
    if (!this.courseReady || !this.svgReady) return;

    this.zone.runOutsideAngular(() => {
      let tries = 0;
      const attempt = () => {
        const ok = this.tryComputeOnce();
        if (!ok && tries < maxRetries) {
          tries++;
          requestAnimationFrame(attempt);
        }
      };
      requestAnimationFrame(attempt);
    });
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
    if (!d.trim()) return false;

    let L = 0;
    try {
      L = path.getTotalLength();
    } catch {
      L = 0;
    }
    if (!isFinite(L) || L <= 0) return false;

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
      this.cdr.markForCheck(); // if you use OnPush; safe otherwise
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
