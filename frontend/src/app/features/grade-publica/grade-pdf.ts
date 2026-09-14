import type { jsPDF } from 'jspdf';
import type { CellHookData, RowInput } from 'jspdf-autotable';
import { AulaVm, DIAS, LinhaVm } from '../grade/grade.view';

export interface SecaoPdf {
  titulo: string;
  subtitulo: string | null;
  linhas: LinhaVm[];
  mostrarTurma: boolean;
  mostrarProfessores: boolean;
}

export interface DocumentoPdf {
  arquivo: string;
  periodo: string;
  detalhePeriodo: string;
  secoes: SecaoPdf[];
}

type Cor = [number, number, number];

const COR = {
  marca: [45, 59, 135] as Cor,
  marcaEscura: [36, 48, 109] as Cor,
  marcaTenue: [238, 241, 251] as Cor,
  marcaBorda: [217, 224, 247] as Cor,
  texto: [9, 9, 11] as Cor,
  suave: [113, 113, 122] as Cor,
  borda: [228, 228, 231] as Cor,
  chip: [244, 244, 245] as Cor,
  faixaHorario: [250, 250, 251] as Cor,
  papel: [255, 255, 255] as Cor,
};

const MARGEM = { esquerda: 12, direita: 12, topo: 28, rodape: 18 };
const AUTOR = 'Ricardo Costa da Silva';
const LARGURA_HORARIO = 22;
const RAIO_TABELA = 2.6;
const RAIO_CARTAO = 1.3;
const PADDING_CELULA = 1.2;
const ESPACO_ENTRE_CARTOES = 1.2;
const PADDING_CARTAO = { x: 1.6, y: 1.2 };
const ALTURA_MINIMA_LINHA = 10.5;

type TipoLinha = 'codigo' | 'nome' | 'meta';

const ESTILO: Record<TipoLinha, { tamanho: number; altura: number; peso: string; cor: Cor }> = {
  codigo: { tamanho: 6.8, altura: 2.7, peso: 'bold', cor: COR.texto },
  nome: { tamanho: 6.2, altura: 2.4, peso: 'normal', cor: COR.texto },
  meta: { tamanho: 5.8, altura: 2.2, peso: 'normal', cor: COR.suave },
};

interface LinhaCartao {
  texto: string;
  tipo: TipoLinha;
  italico?: boolean;
  chip?: string | null;
}

export function sanitizarNomeArquivo(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'grade'
  );
}

function fonte(doc: jsPDF, peso: string, tamanho: number, cor: Cor): void {
  doc.setFont('helvetica', peso);
  doc.setFontSize(tamanho);
  doc.setTextColor(cor[0], cor[1], cor[2]);
}

function quebrar(doc: jsPDF, texto: string, tipo: TipoLinha, largura: number): string[] {
  doc.setFont('helvetica', ESTILO[tipo].peso);
  doc.setFontSize(ESTILO[tipo].tamanho);
  return doc.splitTextToSize(texto, largura) as string[];
}

function linhasDoCartao(doc: jsPDF, vm: AulaVm, secao: SecaoPdf, largura: number): LinhaCartao[] {
  const aula = vm.aula;
  const linhas: LinhaCartao[] = [
    { texto: aula.disciplina?.codigo ?? '—', tipo: 'codigo', chip: vm.sigla },
  ];
  if (aula.disciplina?.nome) {
    for (const parte of quebrar(doc, aula.disciplina.nome, 'nome', largura)) {
      linhas.push({ texto: parte, tipo: 'nome' });
    }
  }
  if (secao.mostrarTurma && aula.turma) {
    for (const parte of quebrar(doc, aula.turma, 'meta', largura)) {
      linhas.push({ texto: parte, tipo: 'meta' });
    }
  }
  if (secao.mostrarProfessores && aula.professores.length) {
    for (const parte of quebrar(doc, aula.professores.join(', '), 'meta', largura)) {
      linhas.push({ texto: parte, tipo: 'meta', italico: true });
    }
  }
  if (aula.sala) {
    for (const parte of quebrar(doc, aula.sala, 'meta', largura)) {
      linhas.push({ texto: parte, tipo: 'meta' });
    }
  }
  return linhas;
}

function alturaDoCartao(linhas: LinhaCartao[]): number {
  const conteudo = linhas.reduce((soma, linha) => soma + ESTILO[linha.tipo].altura, 0);
  return conteudo + PADDING_CARTAO.y * 2;
}

function alturaDaCelula(cartoes: LinhaCartao[][]): number {
  if (!cartoes.length) return 0;
  const cartao = cartoes.reduce((soma, linhas) => soma + alturaDoCartao(linhas), 0);
  return cartao + ESPACO_ENTRE_CARTOES * (cartoes.length - 1) + PADDING_CELULA * 2;
}

function desenharCartao(
  doc: jsPDF,
  x: number,
  y: number,
  largura: number,
  linhas: LinhaCartao[],
): number {
  const altura = alturaDoCartao(linhas);
  doc.setFillColor(COR.papel[0], COR.papel[1], COR.papel[2]);
  doc.setDrawColor(COR.borda[0], COR.borda[1], COR.borda[2]);
  doc.setLineWidth(0.15);
  doc.roundedRect(x, y, largura, altura, RAIO_CARTAO, RAIO_CARTAO, 'FD');

  let cursor = y + PADDING_CARTAO.y;
  for (const linha of linhas) {
    const estilo = ESTILO[linha.tipo];
    cursor += estilo.altura;
    const base = cursor - 0.6;
    fonte(doc, linha.italico ? 'italic' : estilo.peso, estilo.tamanho, estilo.cor);
    doc.text(linha.texto, x + PADDING_CARTAO.x, base);

    if (linha.chip) {
      const inicio = x + PADDING_CARTAO.x + doc.getTextWidth(linha.texto) + 1.4;
      fonte(doc, 'bold', 4.8, COR.suave);
      const larguraChip = doc.getTextWidth(linha.chip) + 1.8;
      doc.setFillColor(COR.chip[0], COR.chip[1], COR.chip[2]);
      doc.roundedRect(inicio, base - 1.9, larguraChip, 2.5, 0.7, 0.7, 'F');
      doc.text(linha.chip, inicio + 0.9, base - 0.25);
    }
  }
  return altura;
}

function desenharCelula(
  doc: jsPDF,
  celula: { x: number; y: number; width: number },
  cartoes: LinhaCartao[][],
): void {
  let cursor = celula.y + PADDING_CELULA;
  const largura = celula.width - PADDING_CELULA * 2;
  for (const linhas of cartoes) {
    cursor += desenharCartao(doc, celula.x + PADDING_CELULA, cursor, largura, linhas);
    cursor += ESPACO_ENTRE_CARTOES;
  }
}

function desenharFundoHorario(
  doc: jsPDF,
  celula: { x: number; y: number; width: number; height: number },
  ultima: boolean,
): void {
  doc.setFillColor(COR.faixaHorario[0], COR.faixaHorario[1], COR.faixaHorario[2]);
  if (!ultima) {
    doc.rect(celula.x, celula.y, celula.width, celula.height, 'F');
    return;
  }
  doc.roundedRect(celula.x, celula.y, celula.width, celula.height, RAIO_TABELA, RAIO_TABELA, 'F');
  doc.rect(celula.x, celula.y, celula.width, celula.height - RAIO_TABELA, 'F');
  doc.rect(celula.x + RAIO_TABELA, celula.y, celula.width - RAIO_TABELA, celula.height, 'F');
}

function desenharHorario(
  doc: jsPDF,
  celula: { x: number; y: number; width: number; height: number },
  linha: LinhaVm,
): void {
  const centro = celula.x + celula.width / 2;
  const meio = celula.y + celula.height / 2;
  fonte(doc, 'bold', 6.6, COR.texto);
  doc.text(linha.turnoRotulo, centro, meio - 0.3, { align: 'center' });
  fonte(doc, 'normal', 6, COR.suave);
  doc.text(linha.faixa, centro, meio + 2.4, { align: 'center' });
}

function desenharCabecalho(
  doc: jsPDF,
  secao: SecaoPdf,
  documento: DocumentoPdf,
  larguraTabela: number,
): void {
  const x = MARGEM.esquerda;

  fonte(doc, 'bold', 6.4, COR.marca);
  doc.text('CHRONOS · IFAC', x, 12);

  fonte(doc, 'bold', 14, COR.texto);
  doc.text(secao.titulo, x, 19.5);

  fonte(doc, 'normal', 7.6, COR.suave);
  doc.text(documento.detalhePeriodo, x, 24.5);

  const direita = x + larguraTabela;
  fonte(doc, 'bold', 7, COR.marca);
  const larguraPeriodo = doc.getTextWidth(documento.periodo) + 5;
  doc.setFillColor(COR.marcaTenue[0], COR.marcaTenue[1], COR.marcaTenue[2]);
  doc.roundedRect(direita - larguraPeriodo, 8, larguraPeriodo, 5.4, 2.7, 2.7, 'F');
  doc.text(documento.periodo, direita - larguraPeriodo / 2, 11.7, { align: 'center' });

  if (secao.subtitulo) {
    fonte(doc, 'normal', 7, COR.suave);
    doc.text(secao.subtitulo, direita, 19, { align: 'right' });
  }
}

function desenharRodapes(doc: jsPDF, geradoEm: string, larguraTabela: number): void {
  const altura = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  const x = MARGEM.esquerda;

  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(COR.borda[0], COR.borda[1], COR.borda[2]);
    doc.setLineWidth(0.2);
    doc.line(x, altura - 15, x + larguraTabela, altura - 15);

    fonte(doc, 'bold', 6.6, COR.marca);
    doc.text('Chronos', x, altura - 11);
    const recuo = doc.getTextWidth('Chronos') + 1.2;
    fonte(doc, 'normal', 6.6, COR.suave);
    doc.text('· IFAC — Campus Rio Branco', x + recuo, altura - 11);
    doc.text(`Gerado em ${geradoEm}`, x + larguraTabela / 2, altura - 11, { align: 'center' });
    doc.text(`Página ${pagina} de ${total}`, x + larguraTabela, altura - 11, { align: 'right' });

    fonte(doc, 'normal', 5.6, COR.suave);
    const prefixo = 'Sistema desenvolvido por ';
    const larguraPrefixo = doc.getTextWidth(prefixo);
    fonte(doc, 'bold', 5.6, COR.marca);
    const larguraAutor = doc.getTextWidth(AUTOR);
    const inicio = x + (larguraTabela - larguraPrefixo - larguraAutor) / 2;
    fonte(doc, 'normal', 5.6, COR.suave);
    doc.text(prefixo, inicio, altura - 6.5);
    fonte(doc, 'bold', 5.6, COR.marca);
    doc.text(AUTOR, inicio + larguraPrefixo, altura - 6.5);
  }
}

function agoraFormatado(): string {
  const agora = new Date();
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  const data = `${doisDigitos(agora.getDate())}/${doisDigitos(agora.getMonth() + 1)}/${agora.getFullYear()}`;
  return `${data} às ${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;
}

export async function gerarGradePdf(documento: DocumentoPdf): Promise<void> {
  const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Grade horária — ${documento.periodo}`,
    subject: 'Grade horária pública do IFAC — Campus Rio Branco',
    author: AUTOR,
    creator: `Chronos · ${AUTOR}`,
  });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const larguraDia =
    (larguraPagina - MARGEM.esquerda - MARGEM.direita - LARGURA_HORARIO) / DIAS.length;
  const larguraTabela = LARGURA_HORARIO + larguraDia * DIAS.length;
  const larguraCartao = larguraDia - PADDING_CELULA * 2 - PADDING_CARTAO.x * 2;

  const colunas: Record<number, { cellWidth: number }> = { 0: { cellWidth: LARGURA_HORARIO } };
  DIAS.forEach((_, indice) => (colunas[indice + 1] = { cellWidth: larguraDia }));

  documento.secoes.forEach((secao, indice) => {
    if (indice > 0) doc.addPage();

    const cartoes = secao.linhas.map((linha) =>
      linha.celulas.map((celula) =>
        celula.aulas.map((vm) => linhasDoCartao(doc, vm, secao, larguraCartao)),
      ),
    );

    const corpo: RowInput[] = secao.linhas.map((_, indiceLinha) => {
      const altura = Math.max(
        ALTURA_MINIMA_LINHA,
        ...cartoes[indiceLinha].map((celula) => alturaDaCelula(celula)),
      );
      return [
        { content: '', styles: { minCellHeight: altura } },
        ...DIAS.map(() => ''),
      ] as RowInput;
    });

    autoTable(doc, {
      head: [['', ...DIAS.map(() => '')]],
      body: corpo,
      startY: MARGEM.topo,
      margin: {
        top: MARGEM.topo,
        left: MARGEM.esquerda,
        right: MARGEM.direita,
        bottom: MARGEM.rodape,
      },
      theme: 'plain',
      rowPageBreak: 'avoid',
      styles: { cellPadding: 0, fontSize: 7, minCellHeight: ALTURA_MINIMA_LINHA },
      headStyles: { minCellHeight: 9 },
      columnStyles: colunas,
      didDrawCell: (dados: CellHookData) => {
        const { cell, column, row, section } = dados;

        if (section === 'head') {
          if (column.index === 0) {
            doc.setFillColor(COR.marcaTenue[0], COR.marcaTenue[1], COR.marcaTenue[2]);
            doc.roundedRect(
              MARGEM.esquerda,
              cell.y,
              larguraTabela,
              cell.height,
              RAIO_TABELA,
              RAIO_TABELA,
              'F',
            );
            doc.rect(
              MARGEM.esquerda,
              cell.y + RAIO_TABELA,
              larguraTabela,
              cell.height - RAIO_TABELA,
              'F',
            );
            doc.setDrawColor(COR.marcaBorda[0], COR.marcaBorda[1], COR.marcaBorda[2]);
            doc.setLineWidth(0.2);
            doc.line(
              MARGEM.esquerda,
              cell.y + cell.height,
              MARGEM.esquerda + larguraTabela,
              cell.y + cell.height,
            );
            return;
          }
          fonte(doc, 'bold', 7.4, COR.marcaEscura);
          doc.text(
            DIAS[column.index - 1].nome,
            cell.x + cell.width / 2,
            cell.y + cell.height / 2 + 1,
            {
              align: 'center',
            },
          );
          return;
        }

        if (column.index === 0) {
          desenharFundoHorario(doc, cell, row.index === corpo.length - 1);
        }

        doc.setDrawColor(COR.borda[0], COR.borda[1], COR.borda[2]);
        doc.setLineWidth(0.15);
        if (column.index > 0) doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        if (row.index < corpo.length - 1) {
          doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        }

        const linha = secao.linhas[row.index];
        if (!linha) return;
        if (column.index === 0) {
          desenharHorario(doc, cell, linha);
          return;
        }
        desenharCelula(doc, cell, cartoes[row.index][column.index - 1]);
      },
      didDrawPage: (dados) => {
        desenharCabecalho(doc, secao, documento, larguraTabela);
        const fim = dados.cursor?.y ?? MARGEM.topo;
        doc.setDrawColor(COR.borda[0], COR.borda[1], COR.borda[2]);
        doc.setLineWidth(0.25);
        doc.roundedRect(
          MARGEM.esquerda,
          MARGEM.topo,
          larguraTabela,
          fim - MARGEM.topo,
          RAIO_TABELA,
          RAIO_TABELA,
          'S',
        );
      },
    });
  });

  desenharRodapes(doc, agoraFormatado(), larguraTabela);
  doc.save(documento.arquivo);
}
