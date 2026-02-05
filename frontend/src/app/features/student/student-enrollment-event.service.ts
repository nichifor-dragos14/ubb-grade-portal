import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AddedSolvedActivityEvent {
  activityId: string;
}

export interface UpdatedSolvedActivityEvent {
  activityId: string;
}

export interface EnrolledToCourseEvent {
  courseId: string;
}

export interface UnenrolledFromCourseEvent {
  courseId: string;
}

@Injectable({ providedIn: 'root' })
export class StudentSolvedActivityEventService {
  private addedSolvedActivitySubject = new Subject<AddedSolvedActivityEvent>();
  addedSolvedActivity$ = this.addedSolvedActivitySubject.asObservable();

  private updatedSolvedActivitySubject =
    new Subject<UpdatedSolvedActivityEvent>();
  updatedSolvedActivity$ = this.updatedSolvedActivitySubject.asObservable();

  emitAddedSolvedActivity(e: AddedSolvedActivityEvent) {
    this.addedSolvedActivitySubject.next(e);
  }
  emitUpdatedSolvedActivity(e: UpdatedSolvedActivityEvent) {
    this.updatedSolvedActivitySubject.next(e);
  }
}

@Injectable({ providedIn: 'root' })
export class StudentEnrollmentEventService {
  private enrolledToCourseSubject = new Subject<EnrolledToCourseEvent>();
  enrolledToCourse$ = this.enrolledToCourseSubject.asObservable();

  private unenrolledFromCourseSubject =
    new Subject<UnenrolledFromCourseEvent>();
  unenrolledFromCourse$ = this.unenrolledFromCourseSubject.asObservable();

  emitEnrolledToCourse(e: EnrolledToCourseEvent) {
    this.enrolledToCourseSubject.next(e);
  }

  emitUnenrolledFromCourse(e: UnenrolledFromCourseEvent) {
    this.unenrolledFromCourseSubject.next(e);
  }
}
