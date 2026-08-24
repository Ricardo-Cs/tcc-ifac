import {
  aulasParaHoras,
  emMinutos,
  formatarDuracao,
  horasParaAulas,
} from './horario';

describe('horario', () => {
  it('converte "HH:MM:SS" em minutos desde a meia-noite', () => {
    expect(emMinutos('07:30:00')).toBe(450);
    expect(emMinutos('22:20:00')).toBe(1340);
    expect(emMinutos('00:00:00')).toBe(0);
  });

  it('converte aulas de 50 minutos em horas de relógio', () => {
    expect(aulasParaHoras(18)).toBe(15);
    expect(aulasParaHoras(9)).toBe(7.5);
    expect(aulasParaHoras(10)).toBeCloseTo(8.3333, 3);
  });

  it('converte horas de relógio em aulas de 50 minutos', () => {
    expect(horasParaAulas(15)).toBe(18);
    expect(horasParaAulas(10)).toBe(12);
  });

  it('formata a duração em horas e minutos', () => {
    expect(formatarDuracao(50)).toBe('50min');
    expect(formatarDuracao(60)).toBe('1h');
    expect(formatarDuracao(550)).toBe('9h10');
  });
});
