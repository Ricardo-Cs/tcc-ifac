import {
  PeriodoFechadoParaEdicaoError,
  garantirPeriodoEditavel,
} from './periodo-editavel';

describe('garantirPeriodoEditavel', () => {
  const CORRENTE = 'periodo-corrente';

  it('permite escrita quando o período alvo é o corrente', () => {
    expect(() => garantirPeriodoEditavel(CORRENTE, CORRENTE)).not.toThrow();
  });

  it('recusa escrita em período que não é o corrente', () => {
    expect(() => garantirPeriodoEditavel('periodo-passado', CORRENTE)).toThrow(
      PeriodoFechadoParaEdicaoError,
    );
  });

  it('recusa escrita quando não há período corrente', () => {
    expect(() => garantirPeriodoEditavel(CORRENTE, null)).toThrow(
      PeriodoFechadoParaEdicaoError,
    );
  });
});
