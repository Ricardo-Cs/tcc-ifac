import { SetMetadata } from '@nestjs/common';

/** Chave lida pelo `JwtAuthGuard` para liberar a rota sem token. */
export const PUBLICO = 'publico';

/** Marca uma rota como aberta (sem exigir autenticação), ex.: o login. */
export const Publico = () => SetMetadata(PUBLICO, true);
