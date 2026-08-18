/**
 * O modelo de leitura do catálogo de ofertas alocáveis. Espelha o papel de
 * `grade.view.ts`: a camada de apresentação resolve os nomes (turma, disciplina,
 * professores) a partir do snapshot e devolve a forma achatada que a interface
 * consome — o domínio entrega ids + a conta de carga, aqui vira rótulo.
 */
import { ResultadoOfertasAlocaveis } from '@application/grade-horaria/listar-ofertas-alocaveis.use-case';
import { GradeSnapshot } from '@domain/grade-horaria/snapshot';

export interface OfertaAlocavelView {
  ofertaId: string;
  turmaId: string | null;
  turma: string | null;
  cursoId: string | null;
  disciplina: { codigo: string; nome: string } | null;
  professores: string[];
  aulasSemana: number;
  aulasAlocadas: number;
  aulasRestantes: number;
}

function nomesProfessores(snapshot: GradeSnapshot, ofertaId: string): string[] {
  const oferta = snapshot.ofertas.get(ofertaId);
  if (!oferta) return [];
  return oferta.professores.map(
    (p) => snapshot.professores.get(p.professorId)?.nome ?? p.professorId,
  );
}

export function montarOfertasAlocaveisView(
  resultado: ResultadoOfertasAlocaveis,
): OfertaAlocavelView[] {
  const { snapshot } = resultado;

  return (
    resultado.ofertas
      .map((carga) => {
        const oferta = snapshot.ofertas.get(carga.ofertaId);
        const turma = oferta ? snapshot.turmas.get(oferta.turmaId) : undefined;
        const disciplina = oferta
          ? snapshot.disciplinas.get(oferta.disciplinaId)
          : undefined;

        return {
          ofertaId: carga.ofertaId,
          turmaId: turma?.id ?? null,
          turma: turma?.nome ?? null,
          cursoId: turma?.cursoId ?? null,
          disciplina: disciplina
            ? { codigo: disciplina.codigo, nome: disciplina.nome }
            : null,
          professores: nomesProfessores(snapshot, carga.ofertaId),
          aulasSemana: carga.aulasSemana,
          aulasAlocadas: carga.aulasAlocadas,
          aulasRestantes: carga.aulasRestantes,
        };
      })
      // Ordena como a interface vai empilhar: turma, depois disciplina. O recorte
      // por turma é feito no front (mesma turma em foco da grade).
      .sort(
        (a, b) =>
          (a.turma ?? '').localeCompare(b.turma ?? '') ||
          (a.disciplina?.nome ?? '').localeCompare(b.disciplina?.nome ?? ''),
      )
  );
}
