import { NgModule } from '@angular/core';
import { DateFormatPipe } from '$shared/date-converter/date-converter.pipe';

@NgModule({
  declarations: [DateFormatPipe],
  exports: [DateFormatPipe],
})
export class DateConverterModule {}
