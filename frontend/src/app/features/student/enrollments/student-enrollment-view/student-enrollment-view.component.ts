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
  ActivityDto,
  CourseDto,
  CourseService,
  SolvedActivityStatus,
} from '$backend/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppPageHeaderComponent } from '$shared/page-header';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  StudentEnrollmentEventService,
  StudentSolvedActivityEventService,
} from '$features/student/student-enrollment-event.service';
import { AppToastService } from '$shared/toast';
import {
  ConfirmUnenrollDialog,
  ConfirmUnenrollDialogData,
} from '$shared/dialogs/confirm-unenroll-dialog.component';

type CPState = 'submitted' | 'completed' | 'returned' | 'unlocked' | 'locked';

interface RoadmapPosition {
  x: number;
  y: number;
  idx: number;
  a: ActivityDto;
  state: CPState;
}

@Component({
  selector: 'app-student-enrollment-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly enrollmentService = inject(
    StudentSolvedActivityEventService
  );
  private readonly studentEnrollmentEventService = inject(
    StudentEnrollmentEventService
  );
  private readonly courseService = inject(CourseService);
  private readonly toastService = inject(AppToastService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('roadPath', { static: false })
  roadPath?: ElementRef<SVGPathElement>;
  @ViewChild('svg', { static: false }) svgRef?: ElementRef<SVGSVGElement>;
  @ViewChild('board', { static: false }) boardRef?: ElementRef<HTMLElement>;
  @ViewChild(MatTooltip, { static: false }) tooltipDir?: MatTooltip;

  @Input() course!: CourseDto;

  private courseReady = false;
  private svgReady = false;

  readonly roadD =
    'M 80 520 C 220 420, 540 560, 700 500 S 600 260, 420 260 S 220 200, 300 120';

  positions: RoadmapPosition[] = [];
  isUnenrolling = false;
  descriptionExpanded = false;

  tooltip = {
    visible: false,
    name: '',
    x: 0,
    y: 0,
  };

  private hideTooltipTimer?: number;

  private resizeObs?: ResizeObserver;

  async ngOnInit() {
    this.enrollmentService.addedSolvedActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshCourse();
      });

    this.enrollmentService.updatedSolvedActivity$
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
      this.descriptionExpanded = false;

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

  isDescriptionLong(): boolean {
    return (this.course?.description ?? '').length > 500;
  }

  getDescriptionText(): string {
    const description = this.course?.description?.trim() ?? '';

    if (!description) {
      return 'No description provided.';
    }

    if (!this.isDescriptionLong() || this.descriptionExpanded) {
      return description;
    }

    return `${description.slice(0, 200).trimEnd()}...`;
  }

  getDescriptionToggleLabel(): string {
    return this.descriptionExpanded ? 'See less' : 'See all';
  }

  toggleDescription(): void {
    this.descriptionExpanded = !this.descriptionExpanded;
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

  onActivityClick(activity: ActivityDto, state: CPState): void {
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

  async unenroll() {
    if (!this.course?.id || this.isUnenrolling) {
      return;
    }

    const courseName = this.course?.name ?? 'this course';
    const confirmed = await this.confirmAction({
      courseName,
    });

    if (!confirmed) {
      return;
    }

    this.isUnenrolling = true;
    this.cdr.markForCheck();

    try {
      await this.courseService.apiCourseIdUnenrollDeleteAsync({
        id: this.course.id,
      });

      this.toastService.open(
        `You successfully unenrolled from ${this.course.name}.`,
        'info'
      );
      this.studentEnrollmentEventService.emitUnenrolledFromCourse({
        courseId: this.course.id,
      });
      await this.router.navigate(['../../'], { relativeTo: this.route });
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isUnenrolling = false;
      this.cdr.markForCheck();
    }
  }

  private async confirmAction(
    data: ConfirmUnenrollDialogData
  ): Promise<boolean> {
    const ref = this.dialog.open(ConfirmUnenrollDialog, {
      data,
      disableClose: true,
      width: '520px',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  onActivityHover(event: MouseEvent, cp: RoadmapPosition): void {
    if (!cp.a?.name) {
      return;
    }

    if (this.hideTooltipTimer) {
      window.clearTimeout(this.hideTooltipTimer);
      this.hideTooltipTimer = undefined;
    }

    this.updateTooltipPositionFromNode(cp, cp.a.name);
  }

  onActivityLeave(): void {
    if (!this.tooltip.visible) {
      return;
    }

    if (this.hideTooltipTimer) {
      window.clearTimeout(this.hideTooltipTimer);
    }

    this.hideTooltipTimer = window.setTimeout(() => {
      this.zone.run(() => {
        this.tooltip.visible = false;
        this.cdr.markForCheck();
      });

      this.tooltipDir?.hide(0);
      this.hideTooltipTimer = undefined;
    }, 120);
  }

  private updateTooltipPositionFromNode(
    cp: RoadmapPosition,
    name?: string
  ): void {
    const boardEl = this.boardRef?.nativeElement;
    const svgEl = this.svgRef?.nativeElement;

    if (!boardEl || !svgEl) {
      return;
    }

    const boardRect = boardEl.getBoundingClientRect();
    const svgRect = svgEl.getBoundingClientRect();
    const svgOffsetX = svgRect.left - boardRect.left;
    const svgOffsetY = svgRect.top - boardRect.top;
    const scaleX = svgRect.width / 800;
    const scaleY = svgRect.height / 600;
    const x = svgOffsetX + cp.x * scaleX;
    const y = svgOffsetY + cp.y * scaleY - 10;

    this.zone.run(() => {
      if (name !== undefined) {
        this.tooltip.name = name;
      }
      this.tooltip.x = x;
      this.tooltip.y = y;
      this.tooltip.visible = true;
      this.cdr.markForCheck();
    });

    requestAnimationFrame(() => {
      this.tooltipDir?.show(0);
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
      const status =
        (acts[i] as any).solvedActivityStatus ??
        (acts[i] as any).solvedStatus ??
        null;
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

  private getUnlockedIndex(acts: ActivityDto[]): number {
    for (let i = 0; i < acts.length; i++) {
      const status =
        (acts[i] as any).solvedActivityStatus ??
        (acts[i] as any).solvedStatus ??
        null;
      if (status === null) {
        return i;
      }
    }

    return -1;
  }
}
