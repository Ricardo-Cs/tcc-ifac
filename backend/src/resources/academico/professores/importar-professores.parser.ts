import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import {
  LinhaBrutaImportacaoProfessor,
  LinhaImportacaoProfessor,
} from '@application/academico/importar-professores.use-case';

const MAPA_CABECALHOS: Record<string, keyof LinhaImportacaoProfessor> = {
  nome: 'nome',
  identificador: 'identificador',
  siape: 'identificador',
  matricula: 'identificador',
  matriculasuap: 'identificador',
  email: 'email',
  titulacao: 'titulacao',
  gruporegime: 'grupoRegime',
  regime: 'grupoRegime',
  ajustecargahoras: 'ajusteCargaHoras',
  ajustecargamotivo: 'ajusteCargaMotivo',
  ativo: 'ativo',
};

function normalizarCabecalho(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function paraTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  if (valor instanceof Date) return valor.toISOString();
  if (
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return String(valor).trim();
  }
  return '';
}

function mapearLinha(bruta: Record<string, unknown>): LinhaImportacaoProfessor {
  const linha: LinhaImportacaoProfessor = {};
  for (const [cabecalho, valor] of Object.entries(bruta)) {
    const campo = MAPA_CABECALHOS[normalizarCabecalho(cabecalho)];
    if (!campo) continue;
    const texto = paraTexto(valor);
    if (texto) {
      linha[campo] = texto;
    }
  }
  return linha;
}

function lerCsv(buffer: Buffer): LinhaBrutaImportacaoProfessor[] {
  const conteudo = buffer.toString('utf-8');
  const primeiraLinha = conteudo.split(/\r?\n/, 1)[0] ?? '';
  const delimitador =
    (primeiraLinha.match(/;/g)?.length ?? 0) >
    (primeiraLinha.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';

  const linhas: LinhaBrutaImportacaoProfessor[] = [];
  parse(conteudo, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: delimitador,
    on_record: (registro: Record<string, unknown>, contexto) => {
      linhas.push({ linha: contexto.lines, dados: mapearLinha(registro) });
      return registro;
    },
  });

  return linhas;
}

async function lerXlsx(
  buffer: Buffer,
): Promise<LinhaBrutaImportacaoProfessor[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const planilha = workbook.worksheets[0];
  if (!planilha) return [];

  const cabecalhos: string[] = [];
  planilha.getRow(1).eachCell({ includeEmpty: true }, (celula, coluna) => {
    cabecalhos[coluna - 1] = valorDaCelula(celula.value);
  });

  const linhas: LinhaBrutaImportacaoProfessor[] = [];
  planilha.eachRow((linha, numeroLinha) => {
    if (numeroLinha === 1) return;
    const bruta: Record<string, unknown> = {};
    linha.eachCell({ includeEmpty: true }, (celula, coluna) => {
      const cabecalho = cabecalhos[coluna - 1];
      if (!cabecalho) return;
      bruta[cabecalho] = valorDaCelula(celula.value);
    });
    if (Object.values(bruta).some((v) => paraTexto(v))) {
      linhas.push({ linha: numeroLinha, dados: mapearLinha(bruta) });
    }
  });

  return linhas;
}

function valorDaCelula(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return '';
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === 'object') {
    if ('text' in valor && typeof valor.text === 'string') {
      return valor.text.trim();
    }
    if ('richText' in valor && Array.isArray(valor.richText)) {
      return valor.richText
        .map((trecho: { text?: unknown }) => paraTexto(trecho.text))
        .join('')
        .trim();
    }
    if ('result' in valor) {
      return valorDaCelula(valor.result);
    }
    return '';
  }
  return paraTexto(valor);
}

const EXTENSOES_CSV = /\.csv$/i;
const EXTENSOES_XLSX = /\.xlsx?$/i;

export async function lerLinhasProfessores(
  arquivo: Express.Multer.File,
): Promise<LinhaBrutaImportacaoProfessor[]> {
  const nome = arquivo.originalname ?? '';
  try {
    if (EXTENSOES_CSV.test(nome)) {
      return lerCsv(arquivo.buffer);
    }
    if (EXTENSOES_XLSX.test(nome)) {
      return await lerXlsx(arquivo.buffer);
    }
  } catch {
    throw new BadRequestException(
      'Não foi possível ler o arquivo. Verifique se é um CSV ou XLSX válido.',
    );
  }
  throw new BadRequestException(
    'Formato de arquivo não suportado — envie um .csv ou .xlsx.',
  );
}
