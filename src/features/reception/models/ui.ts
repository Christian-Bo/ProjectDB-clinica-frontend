export type LoadingMap = Partial<Record<string, boolean>>;

export type DashboardFilters = {
  sedeId?: number;
  servicioId?: number;
  servicioIds?: number[];
  estacionId?: number;
  usuarioId?: number;
};
