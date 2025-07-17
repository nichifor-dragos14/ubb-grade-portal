import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `Remove test text after routing is implemented<router-outlet
    ></router-outlet> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
