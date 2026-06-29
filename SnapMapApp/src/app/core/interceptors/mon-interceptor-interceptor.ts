import { HttpInterceptorFn } from '@angular/common/http';

export const monInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
