import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[clickStopPropagation]',
  standalone: true,
})
export class ClickStopPropagationDirective {
  @Input() preventDefault = false;

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.preventDefault) {
      event.preventDefault();
    }
    event.stopPropagation();
  }
}
