import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PayloadToken } from '@application/auth/auth.service';
import { PUBLICO } from './publico.decorator';

/**
 * Guard global: exige um JWT válido em `Authorization: Bearer` e anexa o payload
 * a `req.user`. Rotas marcadas com `@Publico()` passam sem token (ex.: login).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publico = this.reflector.getAllAndOverride<boolean>(PUBLICO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (publico) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extrairToken(req);
    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }
    try {
      req['user'] = await this.jwt.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    return true;
  }
}

function extrairToken(req: Request): string | null {
  const [tipo, valor] = req.headers.authorization?.split(' ') ?? [];
  return tipo === 'Bearer' && valor ? valor : null;
}
