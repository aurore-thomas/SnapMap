import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monPipe'
})
export class MonPipePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
