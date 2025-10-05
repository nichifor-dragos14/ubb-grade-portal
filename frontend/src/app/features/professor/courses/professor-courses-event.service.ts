import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ActivityCreatedEvent {
  courseId: string;
  activityId: string;
}

export interface CourseCreatedEvent {
  courseId: string;
}

@Injectable({ providedIn: 'root' })
export class ProfessorCoursesEventService {
  private createdActivitySubject = new Subject<ActivityCreatedEvent>();
  activityCreated$ = this.createdActivitySubject.asObservable();

  private createdCourseSubject = new Subject<CourseCreatedEvent>();
  courseCreated$ = this.createdCourseSubject.asObservable();

  emitCreatedActivity(e: ActivityCreatedEvent) {
    this.createdActivitySubject.next(e);
  }

  emitCreatedCourse(e: CourseCreatedEvent) {
    this.createdCourseSubject.next(e);
  }
}
