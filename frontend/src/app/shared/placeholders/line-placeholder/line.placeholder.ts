import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line-placeholder',
  template: `
    <div
      class="linear-background"
      [ngStyle]="{ 'width.px': width, 'height.px': height }"
    ></div>
  `,
  styles: `
        @keyframes placeHolderShimmer {
            0%{
                background-position: -468px 0;
            }
            100%{
                background-position: 468px 0;
            }
        }

        .linear-background {
            animation-duration: 1s;
            animation-fill-mode: forwards;
            animation-iteration-count: infinite;
            animation-name: placeHolderShimmer;
            animation-timing-function: linear;
            background: #f6f7f8;
            background: linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%);
            background-size: 1000px 104px;
            position: relative;
            overflow: hidden;
        }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AppLinePlaceholderComponent {
  @Input() width: number = 200;
  @Input() height: number = 10;
}
