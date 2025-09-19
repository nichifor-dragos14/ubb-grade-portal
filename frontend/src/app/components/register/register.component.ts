import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import {
  AccountService,
  CourseDomainDto,
  CourseDto,
  CourseService,
} from '$backend/services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private _formBuilder = inject(FormBuilder);
  private _courseService = inject(CourseService);
  private _accountService = inject(AccountService);

  personalInformationFormGroup = this._formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  courseDomainFormGroup = this._formBuilder.group({
    courseDomains: this._formBuilder.control<string[]>([], {
      validators: [Validators.required],
    }),
  });

  courseFormGroup = this._formBuilder.group({
    courses: this._formBuilder.control<string[]>([], {
      validators: [Validators.required],
    }),
  });

  courseDomains: CourseDomainDto[] = [];
  courses: CourseDto[] = [];

  async ngOnInit() {
    this.courseDomains = await this._courseService.apiCourseDomainsGetAsync();
  }

  async onDomainsSelectionChange(_e: MatSelectionListChange) {
    const courseDomainIds =
      this.courseDomainFormGroup.controls.courseDomains.value;

    if (courseDomainIds == null || courseDomainIds.length == 0) {
      return;
    }

    this.courses = await this._courseService.apiCourseGetAsync({
      courseDomainIds: courseDomainIds,
    });
  }

  async onSubmitForm() {
    const courseIds = this.courseFormGroup.controls.courses.value;
    const email = this.personalInformationFormGroup.controls.email.value;
    const firstName =
      this.personalInformationFormGroup.controls.firstName.value;
    const lastName = this.personalInformationFormGroup.controls.lastName.value;
    const password = this.personalInformationFormGroup.controls.password.value;

    if (courseIds == null || courseIds.length == 0) {
      return;
    }

    const studentRole = 0;

    if (
      email == null ||
      firstName == null ||
      lastName == null ||
      password == null
    ) {
      return;
    }

    await this._accountService.registerPost$JsonAsync({
      body: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password,
        courseIds: courseIds,
        role: studentRole,
      },
    });
  }
}
