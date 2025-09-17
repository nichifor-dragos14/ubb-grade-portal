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
import { MatListModule } from '@angular/material/list';

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

  personalInformationFormGroup = this._formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  courseDomainFormGroup = this._formBuilder.group({
    courseDomains: ['', Validators.required],
  });

  courseFormGroup = this._formBuilder.group({
    courses: ['', Validators.required],
  });
  courseDomains: string[] = [
    'Artificial Intelligence',
    'Data Science & Analytics',
    'Cybersecurity',
    'Software Engineering',
    'Computer Systems & Networking',
    'Web & Mobile Development',
    'Human-Computer Interaction',
    'Databases',
    'Algorithms & Data Structures',
    'Theory of Computation',
  ];

  courses: string[] = [
    'Introduction to Programming',
    'Object-Oriented Programming',
    'Data Structures',
    'Design & Analysis of Algorithms',
    'Database Management Systems',
    'Introduction to Artificial Intelligence',
    'Machine Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Introduction to Data Science',
    'Data Mining',
    'Big Data Technologies',
    'Foundations of Cybersecurity',
    'Network Security',
    'Cryptography',
    'Software Development Lifecycle',
    'Software Testing & Quality Assurance',
    'Operating Systems',
    'Computer Architecture',
    'Computer Networks',
    'Web Programming Fundamentals',
    'Full-Stack Development',
    'Mobile Application Development (iOS/Android)',
    'User Interface & User Experience (UI/UX) Design',
    'Advanced Database Systems',
    'SQL & NoSQL Databases',
    'Discrete Mathematics for Computer Science',
    'Theory of Automata & Formal Languages',
    'Computational Complexity',
    'Parallel & Distributed Computing',
  ];
}
