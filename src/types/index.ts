export type Language = 'en' | 'hi' | 'mr';

export interface AuthUser {
  id: string;
  phoneNumber: string; // 10 digit Indian number e.g. "9876543210"
  countryCode: string; // e.g. "+91"
  fullName?: string;
  village?: string;
  isVerified: boolean;
  token?: string;
  createdAt: string;
}

export type AreaUnit = 'acre' | 'hectare' | 'bigha';

export type CropId =
  | 'wheat'
  | 'rice'
  | 'maize'
  | 'cotton'
  | 'sugarcane'
  | 'soybean'
  | 'chickpea'
  | 'banana'
  | 'banana_special';

export type FertilizerId =
  | 'urea'
  | 'dap'
  | 'mop'
  | 'npk_19_19_19'
  | 'npk_0_52_34'
  | 'npk_0_0_50'
  | 'zinc_sulphate'
  | 'sulphur'
  | 'ssp'
  | 'ammonium_sulphate'
  | 'magnesium_sulphate'
  | 'npk_13_0_45';

export type AltFertilizerId =
  | 'ssp'
  | 'npk_12_32_16'
  | 'npk_10_26_26'
  | 'npk_20_20_0'
  | 'ammonium_sulphate'
  | 'sop'
  | 'nano_urea'
  | 'npk_13_0_45'
  | 'zn_edta'
  | 'gypsum'
  | 'magnesium_sulphate';

export type AnyFertilizerId = FertilizerId | AltFertilizerId;

export interface NPKValues {
  n: number;
  p: number;
  k: number;
}

export interface FertilizerDefinition {
  id: FertilizerId;
  name: string;
  hiName: string;
  mrName?: string;
  bagWeightKg: number;
  defaultPricePerBag: number;
  npkPercent: NPKValues;
  isMicronutrient?: boolean;
}

export interface FertilizerApplicationTemplate {
  fertilizerId: FertilizerId;
  kgPerAcre: number;
}

export interface CropStageTemplate {
  id: string;
  daysAfterSowing: number;
  stageName: string;
  hiStageName: string;
  mrStageName?: string;
  growthPhase: string;
  hiGrowthPhase: string;
  mrGrowthPhase?: string;
  applications: FertilizerApplicationTemplate[];
  tip: string;
  hiTip: string;
  mrTip?: string;
}

export interface CropProfile {
  id: CropId;
  name: string;
  hiName: string;
  mrName?: string;
  emoji: string;
  accentColor: string;
  durationDays: number;
  season: string;
  hiSeason: string;
  mrSeason?: string;
  stages: CropStageTemplate[];
}

export interface StageAlternativeOverride {
  optionTitle: string;
  hiOptionTitle: string;
  mrOptionTitle?: string;
  unavailableIds: FertilizerId[];
  items: CalculatedFertilizerItem[];
  totalCost: number;
  totalNpk: NPKValues;
  note: string;
  hiNote: string;
  mrNote?: string;
}

export interface AlternativeOption {
  id: string;
  title: string;
  hiTitle: string;
  mrTitle?: string;
  subtitle: string;
  hiSubtitle: string;
  mrSubtitle?: string;
  items: CalculatedFertilizerItem[];
  totalCost: number;
  totalNpk: NPKValues;
  note: string;
  hiNote: string;
  mrNote?: string;
}

export interface FarmerField {
  id: string;
  name: string;
  cropId: CropId;
  sowingDate: string; // YYYY-MM-DD
  areaValue: number;
  areaUnit: AreaUnit;
  completedStageIds: string[];
  completedDates: Record<string, string>; // stageId -> YYYY-MM-DD
  stageOverrides?: Record<string, StageAlternativeOverride>;
  remindersEnabled: boolean;
  notes?: string;
  createdAt: string;
}

export type StageStatus =
  | 'completed'
  | 'overdue'
  | 'due_today'
  | 'upcoming'
  | 'scheduled';

export interface CalculatedFertilizerItem {
  fertilizerId: AnyFertilizerId;
  name: string;
  hiName: string;
  mrName?: string;
  kgAmount: number;
  bagWeightKg: number;
  bags: number;
  estimatedCost: number;
  npk: NPKValues;
  isBottle?: boolean;
}

export interface CalculatedStage {
  id: string;
  daysAfterSowing: number;
  scheduledDate: string; // YYYY-MM-DD
  daysFromToday: number;
  status: StageStatus;
  isCompleted: boolean;
  completedOn?: string;
  stageName: string;
  hiStageName: string;
  mrStageName?: string;
  growthPhase: string;
  hiGrowthPhase: string;
  mrGrowthPhase?: string;
  tip: string;
  hiTip: string;
  mrTip?: string;
  items: CalculatedFertilizerItem[];
  totalCost: number;
  totalNpk: NPKValues;
  activeAlternativeTitle?: string;
  hiActiveAlternativeTitle?: string;
  mrActiveAlternativeTitle?: string;
  activeAlternativeNote?: string;
  hiActiveAlternativeNote?: string;
  mrActiveAlternativeNote?: string;
}

export interface FieldSummary {
  field: FarmerField;
  crop: CropProfile;
  areaInAcres: number;
  daysSinceSowing: number;
  stages: CalculatedStage[];
  nextStage: CalculatedStage | null;
  completedCount: number;
  overdueCount: number;
  dueSoonCount: number;
  plannedNpk: NPKValues;
  appliedNpk: NPKValues;
  plannedCost: number;
  spentCost: number;
}

export interface AppSettings {
  language: Language;
  currencySymbol: string;
  fertilizerPrices: Record<FertilizerId, number>;
  reminderHour: number;
  reminderDaysBefore: number;
}
