import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '@application/auth/auth.service';
import type { PayloadToken } from '@application/auth/auth.service';
import {
  AtualizarPerfilDto,
  LoginDto,
  LoginResponseDto,
  TrocarSenhaDto,
  UsuarioResponseDto,
} from './auth.dto';
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

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza nome e/ou e-mail do usuário autenticado.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiConflictResponse({ description: 'Já existe usuário com esse e-mail.' })
  async atualizarPerfil(
    @Body() dto: AtualizarPerfilDto,
    @UsuarioAtual() atual: PayloadToken,
  ): Promise<UsuarioResponseDto> {
    if (dto.nome === undefined && dto.email === undefined) {
      throw new BadRequestException('Informe nome e/ou email.');
    }
    return UsuarioResponseDto.fromDomain(
      await this.auth.atualizarPerfil(atual.sub, dto),
    );
  }

  @Patch('senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Troca a senha do usuário autenticado — exige a senha atual (a padrão, no primeiro login).',
  })
  @ApiNoContentResponse({ description: 'Senha trocada.' })
  @ApiUnauthorizedResponse({
    description: 'Senha atual incorreta ou sessão inválida.',
  })
  async trocarSenha(
    @Body() dto: TrocarSenhaDto,
    @UsuarioAtual() atual: PayloadToken,
  ): Promise<void> {
    await this.auth.trocarSenha(atual.sub, dto.senhaAtual, dto.novaSenha);
  }
}
