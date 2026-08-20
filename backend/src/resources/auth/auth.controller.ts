import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '@application/auth/auth.service';
import type { PayloadToken } from '@application/auth/auth.service';
import { LoginDto, LoginResponseDto, UsuarioResponseDto } from './auth.dto';
import { Publico } from './publico.decorator';
import { UsuarioAtual } from './usuario-atual.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Publico()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica por e-mail e senha e devolve um JWT.' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const { token, usuario } = await this.auth.login(dto.email, dto.senha);
    return { token, usuario: UsuarioResponseDto.fromDomain(usuario) };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário autenticado (pelo token).' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado.',
  })
  async me(@UsuarioAtual() atual: PayloadToken): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.fromDomain(
      await this.auth.usuarioAtual(atual.sub),
    );
  }
}
