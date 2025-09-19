import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { BackendApiModule } from '$backend/services';
import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import {
  HttpClientModule,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { authInterceptor } from '../auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      BackendApiModule.forRoot({ rootUrl: '/api' }),
      HttpClientModule,
      BrowserAnimationsModule,
      MatSnackBarModule,
      MatIconModule
    ),
  ],
};
