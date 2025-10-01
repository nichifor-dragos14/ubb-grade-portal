import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  template: '',
})
export class CourseDummyComponent implements OnInit {
  router = inject(Router);

  ngOnInit() {
    this.router.navigate(['main/professor/courses']);
  }
}
