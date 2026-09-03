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
    linhas: LinhaImportacaoProfessor[],
  ): Promise<ResultadoImportacaoProfessores> {
    const resultado: ResultadoImportacaoProfessores = {
      totalLinhas: linhas.length,
      criados: 0,
      atualizados: 0,
      erros: [],
    };

    for (const [indice, linha] of linhas.entries()) {
      const numeroLinha = indice + 2;
      try {
        const existente = await this.processarLinha(linha);
        if (existente) {
          resultado.atualizados++;
        } else {
          resultado.criados++;
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

  private async processarLinha(
    linha: LinhaImportacaoProfessor,
  ): Promise<boolean> {
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
      const nome = linha.nome?.trim();
      if (nome) {
        atualizacao.nome = nome;
      }
      await this.professores.atualizar(existente.id, atualizacao);
      return true;
    }

    const nome = (linha.nome ?? '').trim();
    if (!nome) {
      throw new Error('nome é obrigatório.');
    }
    const criacao: CriarProfessorInput = {
      nome,
      identificador,
      ...camposOpcionais,
    };
    await this.professores.criar(criacao);
    return false;
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
