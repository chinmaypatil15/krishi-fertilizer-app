import { CROPS, FERTILIZERS } from '../data/crops';
import {
  AnyFertilizerId,
  AppSettings,
  AreaUnit,
  CalculatedFertilizerItem,
  CalculatedStage,
  CropId,
  FarmerField,
  FertilizerId,
  FieldSummary,
  Language,
  NPKValues,
  StageAlternativeOverride,
  StageStatus,
} from '../types';

export const AREA_TO_ACRES: Record<AreaUnit, number> = {
  acre: 1,
  hectare: 2.47105,
  bigha: 0.619,
};

export function toAcres(value: number, unit: AreaUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value * AREA_TO_ACRES[unit];
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const dt = parseISODate(isoDate);
  dt.setDate(dt.getDate() + days);
  return formatISODate(dt);
}

export function diffDaysISO(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_HI = ['जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'];
const MONTHS_MR = ['जाने', 'फेब्रु', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];

export function formatReadableDate(isoDate: string, lang: Language): string {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return isoDate;
  const months = lang === 'mr' ? MONTHS_MR : lang === 'hi' ? MONTHS_HI : MONTHS_EN;
  const monthLabel = months[m - 1] ?? '';
  return `${d} ${monthLabel} ${y}`;
}

export function roundTo(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function classifyStageStatus(
  isCompleted: boolean,
  daysFromToday: number
): StageStatus {
  if (isCompleted) return 'completed';
  if (daysFromToday < 0) return 'overdue';
  if (daysFromToday === 0) return 'due_today';
  if (daysFromToday <= 7) return 'upcoming';
  return 'scheduled';
}

export interface ScheduleInput {
  cropId: CropId;
  sowingDate: string;
  areaValue: number;
  areaUnit: AreaUnit;
  completedStageIds?: string[];
  completedDates?: Record<string, string>;
  stageOverrides?: Record<string, StageAlternativeOverride>;
  fertilizerPrices: Record<FertilizerId, number>;
  todayISO?: string;
}

export function calculateStages(input: ScheduleInput): CalculatedStage[] {
  const crop = CROPS[input.cropId];
  const acres = toAcres(input.areaValue, input.areaUnit);
  const today = input.todayISO ?? getTodayISO();
  const completedSet = new Set(input.completedStageIds ?? []);
  const completedDates = input.completedDates ?? {};

  return crop.stages.map((stage) => {
    const scheduledDate = addDaysISO(input.sowingDate, stage.daysAfterSowing);
    const daysFromToday = diffDaysISO(today, scheduledDate);
    const isCompleted = completedSet.has(stage.id);
    const status = classifyStageStatus(isCompleted, daysFromToday);

    const items: CalculatedFertilizerItem[] = stage.applications.map((app) => {
      const def = FERTILIZERS[app.fertilizerId];
      const kgAmount = roundTo(app.kgPerAcre * acres, 1);
      const bags = roundTo(kgAmount / def.bagWeightKg, 2);
      const bagPrice = input.fertilizerPrices[app.fertilizerId] ?? def.defaultPricePerBag;
      const estimatedCost = Math.round((kgAmount / def.bagWeightKg) * bagPrice);

      const npk: NPKValues = {
        n: roundTo((kgAmount * def.npkPercent.n) / 100, 1),
        p: roundTo((kgAmount * def.npkPercent.p) / 100, 1),
        k: roundTo((kgAmount * def.npkPercent.k) / 100, 1),
      };

      return {
        fertilizerId: app.fertilizerId,
        name: def.name,
        hiName: def.hiName,
        mrName: def.mrName,
        kgAmount,
        bagWeightKg: def.bagWeightKg,
        bags,
        estimatedCost,
        npk,
      };
    });

    const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
    const totalNpk = items.reduce<NPKValues>(
      (acc, item) => ({
        n: roundTo(acc.n + item.npk.n, 1),
        p: roundTo(acc.p + item.npk.p, 1),
        k: roundTo(acc.k + item.npk.k, 1),
      }),
      { n: 0, p: 0, k: 0 }
    );

    const override = input.stageOverrides?.[stage.id];

    return {
      id: stage.id,
      daysAfterSowing: stage.daysAfterSowing,
      scheduledDate,
      daysFromToday,
      status,
      isCompleted,
      completedOn: completedDates[stage.id],
      stageName: stage.stageName,
      hiStageName: stage.hiStageName,
      mrStageName: stage.mrStageName,
      growthPhase: stage.growthPhase,
      hiGrowthPhase: stage.hiGrowthPhase,
      mrGrowthPhase: stage.mrGrowthPhase,
      tip: stage.tip,
      hiTip: stage.hiTip,
      mrTip: stage.mrTip,
      items: override ? override.items : items,
      totalCost: override ? override.totalCost : totalCost,
      totalNpk: override ? override.totalNpk : totalNpk,
      activeAlternativeTitle: override?.optionTitle,
      hiActiveAlternativeTitle: override?.hiOptionTitle,
      mrActiveAlternativeTitle: override?.mrOptionTitle,
      activeAlternativeNote: override?.note,
      hiActiveAlternativeNote: override?.hiNote,
      mrActiveAlternativeNote: override?.mrNote,
    };
  });
}

export function buildFieldSummary(
  field: FarmerField,
  settings: AppSettings,
  todayISO: string = getTodayISO()
): FieldSummary {
  const crop = CROPS[field.cropId];
  const stages = calculateStages({
    cropId: field.cropId,
    sowingDate: field.sowingDate,
    areaValue: field.areaValue,
    areaUnit: field.areaUnit,
    completedStageIds: field.completedStageIds,
    completedDates: field.completedDates,
    stageOverrides: field.stageOverrides,
    fertilizerPrices: settings.fertilizerPrices,
    todayISO,
  });

  const plannedNpk: NPKValues = { n: 0, p: 0, k: 0 };
  const appliedNpk: NPKValues = { n: 0, p: 0, k: 0 };
  let plannedCost = 0;
  let spentCost = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const st of stages) {
    plannedNpk.n = roundTo(plannedNpk.n + st.totalNpk.n, 1);
    plannedNpk.p = roundTo(plannedNpk.p + st.totalNpk.p, 1);
    plannedNpk.k = roundTo(plannedNpk.k + st.totalNpk.k, 1);
    plannedCost += st.totalCost;

    if (st.isCompleted) {
      completedCount += 1;
      appliedNpk.n = roundTo(appliedNpk.n + st.totalNpk.n, 1);
      appliedNpk.p = roundTo(appliedNpk.p + st.totalNpk.p, 1);
      appliedNpk.k = roundTo(appliedNpk.k + st.totalNpk.k, 1);
      spentCost += st.totalCost;
    } else if (st.status === 'overdue') {
      overdueCount += 1;
    } else if (st.status === 'due_today' || st.status === 'upcoming') {
      dueSoonCount += 1;
    }
  }

  const nextStage = stages.find((st) => !st.isCompleted) ?? null;
  const daysSinceSowing = diffDaysISO(field.sowingDate, todayISO);

  return {
    field,
    crop,
    areaInAcres: roundTo(toAcres(field.areaValue, field.areaUnit), 2),
    daysSinceSowing,
    stages,
    nextStage,
    completedCount,
    overdueCount,
    dueSoonCount,
    plannedNpk,
    appliedNpk,
    plannedCost,
    spentCost,
  };
}

export interface AggregatedFertilizerTotal {
  fertilizerId: AnyFertilizerId;
  name: string;
  hiName: string;
  mrName?: string;
  totalKg: number;
  totalBags: number;
  bagWeightKg: number;
  totalCost: number;
  isBottle?: boolean;
}

export function aggregateStageFertilizers(
  stages: CalculatedStage[]
): AggregatedFertilizerTotal[] {
  const map = new Map<AnyFertilizerId, AggregatedFertilizerTotal>();
  for (const stage of stages) {
    for (const item of stage.items) {
      const existing = map.get(item.fertilizerId);
      if (existing) {
        existing.totalKg = roundTo(existing.totalKg + item.kgAmount, 1);
        existing.totalBags = roundTo(existing.totalKg / existing.bagWeightKg, 2);
        existing.totalCost += item.estimatedCost;
      } else {
        map.set(item.fertilizerId, {
          fertilizerId: item.fertilizerId,
          name: item.name,
          hiName: item.hiName,
          mrName: item.mrName,
          totalKg: item.kgAmount,
          totalBags: item.bags,
          bagWeightKg: item.bagWeightKg,
          totalCost: item.estimatedCost,
          isBottle: item.isBottle,
        });
      }
    }
  }
  return Array.from(map.values());
}
