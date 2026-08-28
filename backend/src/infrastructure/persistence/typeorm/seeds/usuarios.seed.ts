import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UsuarioEntity } from '../entities/comum/usuario.entity';
import { PapelUsuario } from '../entities/comum/enums';

export async function seedUsuarios(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(UsuarioEntity);
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@ifac.edu.br';
  const senha = process.env.SEED_ADMIN_SENHA ?? 'admin123';

  const existe = await repo
    .createQueryBuilder('u')
    .addSelect('u.senha')
    .where('u.email = :email', { email })
    .getOne();

  if (existe) {
    if (!ehHashBcrypt(existe.senha)) {
      await repo.update(
        { id: existe.id },
        { senha: await bcrypt.hash(senha, 10) },
      );
      console.log(`Senha do ADMIN ${email} regravada como hash bcrypt.`);
    }
    if (existe.senhaProvisoria) {
      await repo.update({ id: existe.id }, { senhaProvisoria: false });
    }
    return;
  }

  await repo.save(
    repo.create({
      nome: 'Administrador',
      email,
      senha: await bcrypt.hash(senha, 10),
      papel: PapelUsuario.ADMIN,
      ativo: true,
      senhaProvisoria: false,
    }),
  );
  console.log(`Usuário ADMIN criado: ${email}`);
}

function ehHashBcrypt(senha: string): boolean {
  return /^\$2[aby]\$/.test(senha);
}
