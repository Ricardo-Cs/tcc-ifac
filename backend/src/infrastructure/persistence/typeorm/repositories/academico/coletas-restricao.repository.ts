import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ColetaRestricao,
  ColetasRestricaoRepository,
  CriarColetaRestricaoInput,
} from '@domain/academico/coleta-restricao';
import { ColetaRestricaoEntity } from '../../entities/academico/coleta-restricao.entity';
import {
  isViolacaoChaveEstrangeira,
  isViolacaoUnicidade,
} from '../postgres-error';

@Injectable()
export class TypeormColetasRestricaoRepository implements ColetasRestricaoRepository {
  constructor(
    @InjectRepository(ColetaRestricaoEntity)
    private readonly repo: Repository<ColetaRestricaoEntity>,
  ) {}

  async buscarPorPeriodo(
    periodoLetivoId: string,
  ): Promise<ColetaRestricao | null> {
    const linha = await this.repo.findOne({
      where: { periodoLetivo: { id: periodoLetivoId } },
      relations: { periodoLetivo: true, importadoPor: true },
    });
    return linha ? toModel(linha) : null;
  }

  async criar(input: CriarColetaRestricaoInput): Promise<ColetaRestricao> {
    try {
      const salvo = await this.repo.save(
        this.repo.create({
          periodoLetivo: { id: input.periodoLetivoId },
          importadoPor: { id: input.importadoPorId },
          importadoEm: new Date(),
          arquivoOrigem: input.arquivoOrigem ?? null,
        }),
      );
      return this.recarregar(salvo.id);
    } catch (erro) {
      if (isViolacaoChaveEstrangeira(erro)) {
        throw new BadRequestException('Período letivo informado não existe.');
      }
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          'Este período já tem uma coleta de restrições importada.',
        );
      }
      throw erro;
    }
  }

  async remover(id: string): Promise<boolean> {
    const resultado = await this.repo.delete({ id });
    return (resultado.affected ?? 0) > 0;
  }

  private async recarregar(id: string): Promise<ColetaRestricao> {
    const linha = await this.repo.findOne({
      where: { id },
      relations: { periodoLetivo: true, importadoPor: true },
    });
    return toModel(linha!);
  }
}

function toModel(e: ColetaRestricaoEntity): ColetaRestricao {
  return {
    id: e.id,
    periodoLetivoId: e.periodoLetivo.id,
    importadoEm: e.importadoEm,
    importadoPorId: e.importadoPor.id,
    importadoPorNome: e.importadoPor.nome,
    arquivoOrigem: e.arquivoOrigem,
  };
}
