import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AddedSolvedActivityEvent {
  activityId: string;
}

export interface UpdatedSolvedActivityEvent {
  activityId: string;
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
