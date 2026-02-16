import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ProfessorCreatedEvent {
  professorId: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersEventService {
  private professorCreatedSubject = new Subject<ProfessorCreatedEvent>();
  professorCreated$ = this.professorCreatedSubject.asObservable();

  emitProfessorCreated(event: ProfessorCreatedEvent) {
    this.professorCreatedSubject.next(event);
  }
}
