export type ProjectStatus =
  | 'DRAFT'
  | 'QUOTED'
  | 'APPROVED'
  | 'PRODUCTION'
  | 'INSTALLATION'
  | 'COMPLETED';

export type WindowType = 'SLIDING' | 'HINGED' | 'FIXED' | 'DOOR' | 'CURTAIN_WALL';

export const DEFAULT_BAR_LENGTH_MM = 5800;

export type MaterialCategory = 'PROFILE' | 'GLASS' | 'HARDWARE' | 'ACCESSORY';

export type UserRole = 'ADMIN' | 'MANAGER' | 'ESTIMATOR' | 'DESIGNER' | 'PRODUCTION';

export type GlassSpec =
  | 'CLEAR_6MM'
  | 'CLEAR_8MM'
  | 'TEMPERED_6MM'
  | 'TEMPERED_8MM'
  | 'TEMPERED_10MM'
  | 'TEMPERED_12MM'
  | 'LAMINATED_6_6'
  | 'DGU_24MM'
  | 'LOW_E_DGU_24MM'
  | 'NITRO_70_6MM';

export const GLASS_LABELS_AR: Record<GlassSpec, string> = {
  CLEAR_6MM: 'زجاج شفاف 6 مم',
  CLEAR_8MM: 'زجاج شفاف 8 مم',
  TEMPERED_6MM: 'زجاج مقسّى (سيكوريت) 6 مم',
  TEMPERED_8MM: 'زجاج مقسّى (سيكوريت) 8 مم',
  TEMPERED_10MM: 'زجاج مقسّى (سيكوريت) 10 مم',
  TEMPERED_12MM: 'زجاج مقسّى (سيكوريت) 12 مم',
  LAMINATED_6_6: 'زجاج مصفّح (لامينيت) 6+6 مم',
  DGU_24MM: 'زجاج مزدوج (دبل) 24 مم',
  LOW_E_DGU_24MM: 'زجاج مزدوج عاكس Low-E 24 مم',
  NITRO_70_6MM: 'زجاج نيترو 70 — 6 مم',
};

export const PROJECT_STATUS_LABELS_AR: Record<ProjectStatus, string> = {
  DRAFT: 'مسودة',
  QUOTED: 'تم التسعير',
  APPROVED: 'معتمد',
  PRODUCTION: 'قيد التصنيع',
  INSTALLATION: 'قيد التركيب',
  COMPLETED: 'مكتمل',
};

export interface KpiSummary {
  activeProjects: number;
  pendingQuotations: number;
  monthlyRevenueSAR: number;
  inProductionUnits: number;
  lowStockItems: number;
  openTasks: number;
}
