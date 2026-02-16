import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import {
  LeaderboardsService,
  BadgeDto,
  StudentLeaderboardEntryDto,
} from '$backend/services';
import { AppToastService } from '$shared/toast';
import { StudentBadgesComponent } from './student-badges/student-badges.component';
import { AuthService } from '$core/auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { ProfessorModule } from '$features/professor/professor.module';
import { RouterModule } from '@angular/router';

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-student-leaderboards',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
    StudentBadgesComponent,
    MatButtonModule,
    ProfessorModule,
    RouterModule,
  ],
  templateUrl: './student-leaderboards.component.html',
  styleUrl: './student-leaderboards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLeaderboardsComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly leaderboardsService = inject(LeaderboardsService);
  private readonly toastService = inject(AppToastService);
  private readonly authService = inject(AuthService);

  weeklyEntries: StudentLeaderboardEntryDto[] = [];
  monthlyEntries: StudentLeaderboardEntryDto[] = [];
  badges: BadgeDto[] = [];

  months: MonthOption[] = [];
  currentMonth = new Date().getMonth() + 1;
  selectedMonth = new Date().getMonth() + 1;

  isLoadingWeekly = false;
  isLoadingMonthly = false;
  isLoadingBadges = false;

  async ngOnInit() {
    this.months = this.buildMonthOptions();
    await Promise.all([
      this.loadWeekly(),
      this.loadMonthly(this.selectedMonth),
      this.loadBadges(),
    ]);
  }

  async onMonthChange(month: number) {
    this.selectedMonth = month;
    await this.loadMonthly(month);
  }

  private async loadWeekly() {
    try {
      this.isLoadingWeekly = true;
      this.cdr.detectChanges();

      this.weeklyEntries =
        await this.leaderboardsService.apiLeaderboardsStudentWeeklyGetAsync();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoadingWeekly = false;
      this.cdr.detectChanges();
    }
  }

  private async loadMonthly(month: number) {
    try {
      this.isLoadingMonthly = true;
      this.cdr.detectChanges();

      this.monthlyEntries =
        await this.leaderboardsService.apiLeaderboardsStudentMonthlyGetAsync({
          month,
        });
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoadingMonthly = false;
      this.cdr.detectChanges();
    }
  }

  private async loadBadges() {
    try {
      this.isLoadingBadges = true;
      this.cdr.detectChanges();

      this.badges =
        await this.leaderboardsService.apiLeaderboardsStudentBadgesGetAsync();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoadingBadges = false;
      this.cdr.detectChanges();
    }
  }

  private buildMonthOptions(): MonthOption[] {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    return Array.from({ length: currentMonth }, (_, index) => {
      const month = index + 1;
      const label = new Date(2020, month - 1, 1).toLocaleString('en-US', {
        month: 'long',
      });

      return { value: month, label };
    });
  }

  get isCurrentMonth(): boolean {
    return this.selectedMonth === this.currentMonth;
  }

  get selectedMonthLabel(): string {
    const found = this.months.find(
      (month) => month.value === this.selectedMonth
    );
    if (found) {
      return found.label;
    }

    return new Date(2020, this.selectedMonth - 1, 1).toLocaleString('en-US', {
      month: 'long',
    });
  }

  isCurrentUser(userId?: string | null): boolean {
    if (!userId) {
      return false;
    }

    return String(this.authService.userId() ?? '') === String(userId);
  }
}
