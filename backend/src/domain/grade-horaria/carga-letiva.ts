import { aulasParaHoras } from './horario';
import { GradeSnapshot, Id } from './snapshot';

export function cargaLetivaPorProfessor(
  snapshot: GradeSnapshot,
): Map<Id, number> {
  const aulasPorProfessor = new Map<Id, number>();
  for (const professorId of snapshot.professores.keys()) {
    aulasPorProfessor.set(professorId, 0);
  }

  for (const alocacao of snapshot.alocacoes) {
    const oferta = snapshot.ofertas.get(alocacao.ofertaId);
    if (!oferta) continue;
    for (const { professorId, proporcaoCarga } of oferta.professores) {
      const atual = aulasPorProfessor.get(professorId);
      if (atual === undefined) continue;
      aulasPorProfessor.set(professorId, atual + proporcaoCarga / 100);
    }
  }

  const horasPorProfessor = new Map<Id, number>();
  for (const [professorId, aulas] of aulasPorProfessor) {
    horasPorProfessor.set(professorId, aulasParaHoras(aulas));
  }
  return horasPorProfessor;
}
