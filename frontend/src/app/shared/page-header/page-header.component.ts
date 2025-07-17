import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <h1>{{ title }}</h1>
    <section role="buttons">
      <ng-content select="[button]"></ng-content>
    </section>
  `,
  styles: `
      :host {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          margin-bottom: 16px;
          z-index: 1001;
      }

      h1 {
          margin: 0;
      }

      section[role='buttons'] {
        display: flex;
        flex-direction: row;
        gap: 8px;
        justify-content: center;
      }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AppPageHeaderComponent {
  @Input() title: string = '';
}
