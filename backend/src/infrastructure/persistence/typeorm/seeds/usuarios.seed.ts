import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UsuarioEntity } from '../entities/comum/usuario.entity';
import { PapelUsuario } from '../entities/comum/enums';

/**
 * Garante o usuário ADMIN inicial com a senha em hash bcrypt. Idempotente: se o
 * e-mail já existe com um hash válido, não mexe; se existe com senha em texto
 * puro (resquício de seeds antigas, antes da auth), regrava o hash. Roda antes
 * da seed de grade, que carimba `criadoPor` e reaproveita este mesmo admin. As
 * credenciais vêm do .env (SEED_ADMIN_EMAIL/SENHA), com padrão para dev.
 */
export async function seedUsuarios(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(UsuarioEntity);
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@ifac.edu.br';
  const senha = process.env.SEED_ADMIN_SENHA ?? 'admin123';

  const existe = await repo
    .createQueryBuilder('u')
    .addSelect('u.senha')
    .where('u.email = :email', { email })
    .getOne();

  if (existe && ehHashBcrypt(existe.senha)) return;

  if (existe) {
    await repo.update(
      { id: existe.id },
      { senha: await bcrypt.hash(senha, 10) },
    );
    console.log(`Senha do ADMIN ${email} regravada como hash bcrypt.`);
    return;
  }

  await repo.save(
    repo.create({
      nome: 'Administrador',
      email,
      senha: await bcrypt.hash(senha, 10),
      papel: PapelUsuario.ADMIN,
      ativo: true,
    }),
  );
  console.log(`Usuário ADMIN criado: ${email}`);
}

/** Hashes bcrypt começam com `$2a$`, `$2b$` ou `$2y$`. */
function ehHashBcrypt(senha: string): boolean {
  return /^\$2[aby]\$/.test(senha);
}
