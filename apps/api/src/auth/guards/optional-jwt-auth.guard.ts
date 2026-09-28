import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but does not reject unauthenticated requests.
 * `req.user` is populated when a valid bearer token is present, otherwise null.
 * Used for guest checkout.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user ?? (null as unknown)) as TUser;
  }
}
