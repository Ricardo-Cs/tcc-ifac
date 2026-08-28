import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PapelUsuario } from '@domain/comum/enums';
import { PayloadToken } from '@application/auth/auth.service';
import { PAPEIS } from './papeis.decorator';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<PapelUsuario[]>(PAPEIS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!papeis || papeis.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user: PayloadToken }>();
    if (!papeis.includes(req.user.papel)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    return true;
  }
}
