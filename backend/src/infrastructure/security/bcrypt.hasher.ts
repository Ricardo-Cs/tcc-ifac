import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SenhaHasher } from '@domain/comum/usuario';

/** Fator de custo do bcrypt. 10 é o equilíbrio usual entre custo e segurança. */
const ROUNDS = 10;

/** Adaptador bcrypt da porta `SenhaHasher`. */
@Injectable()
export class BcryptHasher implements SenhaHasher {
  comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  hashear(senha: string): Promise<string> {
    return bcrypt.hash(senha, ROUNDS);
  }
}
