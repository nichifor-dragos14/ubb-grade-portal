import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AddedSolvedActivityEvent {
  activityId: string;
}

@Injectable({ providedIn: 'root' })
export class StudentSolvedActivityEventService {
  private addedSolvedActivitySubject = new Subject<AddedSolvedActivityEvent>();
  addedSolvedActivity$ = this.addedSolvedActivitySubject.asObservable();

  emitAddedSolvedActivity(e: AddedSolvedActivityEvent) {
    this.addedSolvedActivitySubject.next(e);
  }
}
