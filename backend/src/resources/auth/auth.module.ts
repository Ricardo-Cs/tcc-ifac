import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SENHA_HASHER, USUARIOS_AUTH_REPOSITORY } from '@domain/comum/usuario';
import { AuthService } from '@application/auth/auth.service';
import { UsuarioEntity } from '@infrastructure/persistence/typeorm/entities/comum/usuario.entity';
import { TypeormUsuariosRepository } from '@infrastructure/persistence/typeorm/repositories/comum/usuarios.repository';
import { BcryptHasher } from '@infrastructure/security/bcrypt.hasher';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PapeisGuard } from './papeis.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES') ?? '1d',
        } as JwtSignOptions,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: USUARIOS_AUTH_REPOSITORY, useClass: TypeormUsuariosRepository },
    { provide: SENHA_HASHER, useClass: BcryptHasher },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
})
export class AuthModule {}
