import { Inject, Injectable } from '@nestjs/common';
import { GrupoRegime } from '@domain/academico/enums';
import {
  AtualizarProfessorInput,
  CriarProfessorInput,
  PROFESSORES_REPOSITORY,
} from '@domain/academico/professor';
import type { ProfessoresRepository } from '@domain/academico/professor';

export interface LinhaImportacaoProfessor {
  nome?: string;
  identificador?: string;
  email?: string;
  titulacao?: string;
  grupoRegime?: string;
  ajusteCargaHoras?: string;
  ajusteCargaMotivo?: string;
  ativo?: string;
}

export interface LinhaBrutaImportacaoProfessor {
  linha: number;
  dados: LinhaImportacaoProfessor;
}

export interface ErroImportacaoProfessor {
  linha: number;
  motivo: string;
}

export interface ResultadoImportacaoProfessores {
  totalLinhas: number;
  criados: number;
  atualizados: number;
  erros: ErroImportacaoProfessor[];
}

export type AcaoImportacaoProfessor = 'CRIAR' | 'ATUALIZAR';

export interface PreviaLinhaImportacaoProfessor {
  linha: number;
  nome: string;
  identificador: string;
  acao: AcaoImportacaoProfessor;
}

export interface PreviaImportacaoProfessores {
  totalLinhas: number;
  linhas: PreviaLinhaImportacaoProfessor[];
  erros: ErroImportacaoProfessor[];
}

type LinhaResolvida =
  | {
      acao: 'CRIAR';
      identificador: string;
      nome: string;
      criacao: CriarProfessorInput;
    }
  | {
      acao: 'ATUALIZAR';
      identificador: string;
      nome: string;
      professorId: string;
      atualizacao: AtualizarProfessorInput;
    };

const GRUPOS_REGIME_VALIDOS = new Set<string>(Object.values(GrupoRegime));
const VALORES_ATIVO_VERDADEIRO = new Set(['true', '1', 'sim']);
const VALORES_ATIVO_FALSO = new Set(['false', '0', 'nao', 'não']);

@Injectable()
export class ImportarProfessoresUseCase {
  constructor(
    @Inject(PROFESSORES_REPOSITORY)
    private readonly professores: ProfessoresRepository,
  ) {}

  async executar(
    linhas: LinhaBrutaImportacaoProfessor[],
  ): Promise<ResultadoImportacaoProfessores> {
    const resultado: ResultadoImportacaoProfessores = {
      totalLinhas: linhas.length,
      criados: 0,
      atualizados: 0,
      erros: [],
    };

    for (const { linha: numeroLinha, dados } of linhas) {
      try {
        const resolvida = await this.resolverLinha(dados);
        if (resolvida.acao === 'CRIAR') {
          await this.professores.criar(resolvida.criacao);
          resultado.criados++;
        } else {
          await this.professores.atualizar(
            resolvida.professorId,
            resolvida.atualizacao,
          );
          resultado.atualizados++;
        }
      } catch (erro) {
        resultado.erros.push({
          linha: numeroLinha,
          motivo: erro instanceof Error ? erro.message : 'Erro desconhecido.',
        });
      }
    }

    return resultado;
  }

  async simular(
    linhas: LinhaBrutaImportacaoProfessor[],
  ): Promise<PreviaImportacaoProfessores> {
    const previa: PreviaImportacaoProfessores = {
      totalLinhas: linhas.length,
      linhas: [],
      erros: [],
    };

    for (const { linha: numeroLinha, dados } of linhas) {
      try {
        const resolvida = await this.resolverLinha(dados);
        previa.linhas.push({
          linha: numeroLinha,
          nome: resolvida.nome,
          identificador: resolvida.identificador,
          acao: resolvida.acao,
        });
      } catch (erro) {
        previa.erros.push({
          linha: numeroLinha,
          motivo: erro instanceof Error ? erro.message : 'Erro desconhecido.',
        });
      }
    }

    return previa;
  }

  private async resolverLinha(
    linha: LinhaImportacaoProfessor,
  ): Promise<LinhaResolvida> {
    const identificador = (linha.identificador ?? '').trim();
    if (!identificador) {
      throw new Error('identificador é obrigatório.');
    }
    if (identificador.length > 50) {
      throw new Error('identificador excede 50 caracteres.');
    }

    const camposOpcionais = this.extrairCamposOpcionais(linha);
    const existente =
      await this.professores.buscarPorIdentificador(identificador);

    if (existente) {
      const atualizacao: AtualizarProfessorInput = { ...camposOpcionais };
      const nomeInformado = linha.nome?.trim();
      if (nomeInformado) {
        atualizacao.nome = nomeInformado;
      }
      return {
        acao: 'ATUALIZAR',
        identificador,
        nome: nomeInformado || existente.nome,
        professorId: existente.id,
        atualizacao,
      };
    }

    const nome = (linha.nome ?? '').trim();
    if (!nome) {
      throw new Error('nome é obrigatório.');
    }
    return {
      acao: 'CRIAR',
      identificador,
      nome,
      criacao: { nome, identificador, ...camposOpcionais },
    };
  }

  private extrairCamposOpcionais(
    linha: LinhaImportacaoProfessor,
  ): Partial<CriarProfessorInput> {
    const campos: Partial<CriarProfessorInput> = {};

    if (linha.email !== undefined) {
      const email = linha.email.trim();
      campos.email = email || null;
    }

    if (linha.titulacao !== undefined) {
      const titulacao = linha.titulacao.trim();
      campos.titulacao = titulacao || null;
    }

    if (linha.grupoRegime !== undefined) {
      const bruto = linha.grupoRegime.trim().toUpperCase();
      if (!bruto) {
        campos.grupoRegime = null;
      } else if (!GRUPOS_REGIME_VALIDOS.has(bruto)) {
        throw new Error(
          `grupoRegime "${linha.grupoRegime}" inválido — use um de: ${[...GRUPOS_REGIME_VALIDOS].join(', ')}.`,
        );
      } else {
        campos.grupoRegime = bruto as GrupoRegime;
      }
    }

    if (linha.ajusteCargaHoras !== undefined) {
      const bruto = linha.ajusteCargaHoras.trim();
      if (!bruto) {
        campos.ajusteCargaHoras = null;
      } else {
        const valor = Number(bruto);
        if (!Number.isInteger(valor)) {
          throw new Error('ajusteCargaHoras deve ser um número inteiro.');
        }
        campos.ajusteCargaHoras = valor;
      }
    }

    if (linha.ajusteCargaMotivo !== undefined) {
      const motivo = linha.ajusteCargaMotivo.trim();
      campos.ajusteCargaMotivo = motivo || null;
    }

    if (linha.ativo !== undefined) {
      const bruto = linha.ativo.trim().toLowerCase();
      if (VALORES_ATIVO_VERDADEIRO.has(bruto)) {
        campos.ativo = true;
      } else if (VALORES_ATIVO_FALSO.has(bruto)) {
        campos.ativo = false;
      } else if (bruto) {
        throw new Error(
          `ativo "${linha.ativo}" inválido — use true/false, sim/não ou 1/0.`,
        );
      }
    }

    return campos;
  }
}
