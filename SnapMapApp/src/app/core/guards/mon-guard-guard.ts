import { CanActivateFn } from '@angular/router';

export const monGuardGuard: CanActivateFn = (route, state) => {
  return true;
};
