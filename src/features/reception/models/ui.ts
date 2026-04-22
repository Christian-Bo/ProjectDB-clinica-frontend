export type LoadingMap = Partial<Record<string, boolean>>;

export type DashboardFilters = {
  sedeId?: number;
  servicioId?: number;
  estacionId?: number;
  usuarioId: number;
};
