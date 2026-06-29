import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { monGuardGuard } from './mon-guard-guard';

describe('monGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => monGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
