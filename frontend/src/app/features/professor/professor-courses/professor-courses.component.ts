import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { DateConverterModule } from '$shared/date-converter';

import { CourseService, ProfessorCreatedCourse } from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';

@Component({
  selector: 'app-professor-courses',
  templateUrl: './professor-courses.component.html',
  styleUrls: ['./professor-courses.component.scss'],
  imports: [
    RouterModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    CommonModule,
    MatBadgeModule,
    DateConverterModule,
    AppPageHeaderComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorCoursesComponent implements OnInit {
  readonly courseService = inject(CourseService);
  private cdr = inject(ChangeDetectorRef);

  courses: ProfessorCreatedCourse[] = [];

  async ngOnInit() {
    this.courses = await this.courseService.apiCourseCreatedGetAsync();
    this.cdr.detectChanges();
  }
}
