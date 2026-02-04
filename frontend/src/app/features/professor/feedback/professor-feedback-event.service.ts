import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface GradedSolvedActivity {
  solvedActivityId: string;
}

@Injectable({ providedIn: 'root' })
export class ProfessorFeedbackEventService {
  private gradedSolvedActivity = new Subject<GradedSolvedActivity>();
  gradedSolvedActivity$ = this.gradedSolvedActivity.asObservable();

  emitGradedSolvedActivity(e: GradedSolvedActivity) {
    this.gradedSolvedActivity.next(e);
  }
}
