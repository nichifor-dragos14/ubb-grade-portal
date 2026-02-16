import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BadgeDto } from '$backend/services';

@Component({
  selector: 'app-student-badges',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './student-badges.component.html',
  styleUrl: './student-badges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentBadgesComponent implements OnChanges {
  @Input() badges: BadgeDto[] = [];
  pageSize = 3;
  pageIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['badges']) {
      this.pageIndex = 0;
    }
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.badges.length / this.pageSize));
  }

  get pagedBadges(): BadgeDto[] {
    const start = this.pageIndex * this.pageSize;
    return this.badges.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.pageCount) {
      this.pageIndex += 1;
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
    }
  }

  getBadgeClass(position: number): string {
    if (position === 1) {
      return 'badge-gold';
    }

    if (position === 2) {
      return 'badge-silver';
    }

    if (position === 3) {
      return 'badge-bronze';
    }

    return 'badge-green';
  }
}
