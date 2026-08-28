import { SetMetadata } from '@nestjs/common';
import { PapelUsuario } from '@domain/comum/enums';

export const PAPEIS = 'papeis';

export const Papeis = (...papeis: PapelUsuario[]) =>
  SetMetadata(PAPEIS, papeis);
