import {
  PublicacaoComConflitoForteError,
  garantirPodePublicar,
} from './trava-publicacao';

describe('garantirPodePublicar', () => {
  it('permite publicar quando não há conflito forte', () => {
    expect(() => garantirPodePublicar(false)).not.toThrow();
  });

  it('recusa publicar quando há conflito forte', () => {
    expect(() => garantirPodePublicar(true)).toThrow(
      PublicacaoComConflitoForteError,
    );
  });
});
