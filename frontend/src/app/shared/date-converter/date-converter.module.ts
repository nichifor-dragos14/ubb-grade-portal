import { NgModule } from '@angular/core';
import { DateFormatPipe } from './date-converter.pipe';

@NgModule({
  declarations: [DateFormatPipe],
  exports: [DateFormatPipe],
})
export class DateConverterModule {}

