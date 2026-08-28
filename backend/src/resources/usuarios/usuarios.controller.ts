import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsuariosService } from '@application/comum/usuarios.service';
import type { PayloadToken } from '@application/auth/auth.service';
import { PapelUsuario } from '@domain/comum/enums';
import { Papeis } from '@resources/auth/papeis.decorator';
import { UsuarioAtual } from '@resources/auth/usuario-atual.decorator';
import {
  AtualizarUsuarioDto,
  CriarUsuarioDto,
  UsuarioResponseDto,
} from './usuarios.dto';

@ApiTags('usuarios')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Requer papel ADMIN.' })
@Controller('usuarios')
@Papeis(PapelUsuario.ADMIN)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários, ordenados por nome.' })
  @ApiOkResponse({ type: UsuarioResponseDto, isArray: true })
  async listar(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.usuarios.listar();
    return usuarios.map((usuario) => UsuarioResponseDto.fromDomain(usuario));
  }

  @Post()
  @ApiOperation({
    summary:
      'Cadastra um novo usuário com a senha padrão — ele precisará trocá-la no primeiro login.',
  })
  @ApiCreatedResponse({ type: UsuarioResponseDto })
  @ApiConflictResponse({ description: 'Já existe usuário com o mesmo e-mail.' })
  async criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.fromDomain(await this.usuarios.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza parcialmente um usuário (inclusive papel e status).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiConflictResponse({ description: 'Já existe usuário com o mesmo e-mail.' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @UsuarioAtual() atual: PayloadToken,
  ): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.fromDomain(
      await this.usuarios.atualizar(id, dto, atual.sub),
    );
  }

  @Post(':id/redefinir-senha')
  @ApiOperation({
    summary:
      'Redefine a senha do usuário para a padrão — ele precisará trocá-la no próximo login.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async redefinirSenha(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.fromDomain(
      await this.usuarios.redefinirSenha(id),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Usuário removido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  remover(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() atual: PayloadToken,
  ): Promise<void> {
    return this.usuarios.remover(id, atual.sub);
  }
}
