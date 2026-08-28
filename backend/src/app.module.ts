import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from '@infrastructure/persistence/typeorm/typeorm.module';
import { AuthModule } from '@resources/auth/auth.module';
import { GradeHorariaModule } from '@resources/grade-horaria/grade-horaria.module';
import { AcademicoModule } from '@resources/academico/academico.module';
import { PeriodosModule } from '@resources/periodos/periodos.module';
import { UsuariosModule } from '@resources/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PersistenceModule,
    AuthModule,
    AcademicoModule,
    PeriodosModule,
    UsuariosModule,
    GradeHorariaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
