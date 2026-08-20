import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadToken } from '@application/auth/auth.service';

/**
 * Injeta o payload do token do usuário autenticado (anexado ao request pelo
 * `JwtAuthGuard`). Uso: `metodo(@UsuarioAtual() usuario: PayloadToken)`.
 */
export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): PayloadToken => {
    const req = ctx.switchToHttp().getRequest<{ user: PayloadToken }>();
    return req.user;
  },
);
