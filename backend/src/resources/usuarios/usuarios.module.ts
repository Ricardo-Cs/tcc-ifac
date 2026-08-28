import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SENHA_HASHER, USUARIOS_REPOSITORY } from '@domain/comum/usuario';
import { UsuariosService } from '@application/comum/usuarios.service';
import { UsuarioEntity } from '@infrastructure/persistence/typeorm/entities/comum/usuario.entity';
import { TypeormUsuariosRepository } from '@infrastructure/persistence/typeorm/repositories/comum/usuarios.repository';
import { BcryptHasher } from '@infrastructure/security/bcrypt.hasher';
import { UsuariosController } from './usuarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEntity])],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORY, useClass: TypeormUsuariosRepository },
    { provide: SENHA_HASHER, useClass: BcryptHasher },
  ],
})
export class UsuariosModule {}
