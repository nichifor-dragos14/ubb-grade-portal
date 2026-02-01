import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZone } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  ActivityStudentDto,
  CourseDetailsStudentDto,
  CourseService,
  SolvedActivityStatus,
} from '$backend/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppPageHeaderComponent } from '$shared/page-header';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StudentSolvedActivityEventService } from '$features/student/student-enrollment-event.service';

type CPState = 'submitted' | 'completed' | 'returned' | 'unlocked' | 'locked';

interface RoadmapPosition {
  x: number;
  y: number;
  idx: number;
  a: ActivityStudentDto;
  state: CPState;
}

@Component({
  selector: 'app-student-enrollment-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    AppPageHeaderComponent,
    RouterModule,
  ],
  templateUrl: './student-enrollment-view.component.html',
  styleUrls: ['./student-enrollment-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentViewComponent
  implements AfterViewInit, OnChanges, OnDestroy, OnInit
{
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly enrollmentService = inject(
    StudentSolvedActivityEventService
  );
  private readonly courseService = inject(CourseService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('roadPath', { static: false })
  roadPath?: ElementRef<SVGPathElement>;
  @ViewChild('svg', { static: false }) svgRef?: ElementRef<SVGSVGElement>;

  @Input() course!: CourseDetailsStudentDto;

  private courseReady = false;
  private svgReady = false;

  readonly roadD =
    'M 80 520 C 220 420, 540 560, 700 500 S 600 260, 420 260 S 220 200, 300 120';

  positions: RoadmapPosition[] = [];

  private resizeObs?: ResizeObserver;

  async ngOnInit() {
    this.enrollmentService.addedSolvedActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshCourse();
      });
  }

  ngAfterViewInit(): void {
    this.svgReady = true;

    if (this.svgRef?.nativeElement) {
      const svg = this.svgRef.nativeElement;

      if ('ResizeObserver' in window) {
        this.resizeObs = new ResizeObserver(() => this.safeComputeWithRetry());
        this.resizeObs.observe(svg);
      }
    }

    if (this.course) {
      this.courseReady = true;
      this.safeComputeWithRetry();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
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

  private async refreshCourse() {
    const courseId = this.course.id;

    try {
      const updated = await this.courseService.apiCourseIdStudentGetAsync({
        id: courseId,
      });

      this.zone.run(() => {
        this.course = updated;
        this.courseReady = !!this.course && !!this.course.activities?.length;
        this.safeComputeWithRetry();
        this.cdr.markForCheck();
      });
    } catch (error) {
      console.error('Failed to fetch course:', error);
    }
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById = (_: number, cp: RoadmapPosition) => cp.a.id;

  onActivityClick(activity: ActivityStudentDto, state: CPState): void {
    if (state === 'locked') {
      return;
    }

    const route =
      state === 'completed' || state === 'submitted' || state === 'returned'
        ? 'view'
        : 'solve';

    void this.router.navigate(['activities', activity.id, route], {
      relativeTo: this.route,
    });
  }

  private safeComputeWithRetry(maxRetries = 6): void {
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

    const newPos: RoadmapPosition[] = [];

    for (let i = 0; i < steps; i++) {
      const t = steps === 1 ? 0.05 : i / (steps - 1);
      const pt = path.getPointAtLength(t * L);
      const status = (acts[i] as any).solvedStatus ?? null;
      const state: CPState =
        status === SolvedActivityStatus.$1
          ? 'completed'
          : status === SolvedActivityStatus.$0
            ? 'submitted'
            : status === SolvedActivityStatus.$2
              ? 'returned'
              : i === unlockedIdx
                ? 'unlocked'
                : 'locked';
      newPos.push({ x: pt.x, y: pt.y, idx: i, a: acts[i], state });
    }

    this.zone.run(() => {
      this.positions = newPos;
      this.cdr.markForCheck();
    });
    return true;
  }

  private getUnlockedIndex(acts: ActivityStudentDto[]): number {
    for (let i = 0; i < acts.length; i++) {
      const status = (acts[i] as any).solvedStatus ?? null;
      if (status === null) {
        return i;
      }
    }

    return -1;
  }
}
