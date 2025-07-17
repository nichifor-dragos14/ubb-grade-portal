import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circle-placeholder',
  template: `
    <div
      class="linear-background circle"
      [ngStyle]="{ 'width.px': radius, 'height.px': radius }"
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

        .circle {
            border-radius: 50%;
        }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AppCirclePlaceholderComponent {
  @Input() radius: number = 10;
}
