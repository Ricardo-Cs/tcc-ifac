export const CARGA_LETIVA_PROVIDER = Symbol('CARGA_LETIVA_PROVIDER');
export interface CargaLetivaProvider {
  cargaAtualPorProfessor(): Promise<Map<string, number>>;
}
