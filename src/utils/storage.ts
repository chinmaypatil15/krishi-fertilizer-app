import AsyncStorage from '@react-native-async-storage/async-storage';
import { FERTILIZERS } from '../data/crops';
import { AppSettings, AuthUser, FarmerField, FertilizerId } from '../types';
import { addDaysISO, getTodayISO } from './calculations';

const FIELDS_KEY = '@krishiplan/fields_v1';
const SETTINGS_KEY = '@krishiplan/settings_v1';
const AUTH_KEY = '@krishiplan/auth_user_v1';

export async function loadAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export async function clearAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export function getDefaultFertilizerPrices(): Record<FertilizerId, number> {
  return {
    urea: FERTILIZERS.urea.defaultPricePerBag,
    dap: FERTILIZERS.dap.defaultPricePerBag,
    mop: FERTILIZERS.mop.defaultPricePerBag,
    npk_19_19_19: FERTILIZERS.npk_19_19_19.defaultPricePerBag,
    npk_0_52_34: FERTILIZERS.npk_0_52_34.defaultPricePerBag,
    npk_0_0_50: FERTILIZERS.npk_0_0_50.defaultPricePerBag,
    zinc_sulphate: FERTILIZERS.zinc_sulphate.defaultPricePerBag,
    sulphur: FERTILIZERS.sulphur.defaultPricePerBag,
    ssp: FERTILIZERS.ssp.defaultPricePerBag,
    ammonium_sulphate: FERTILIZERS.ammonium_sulphate.defaultPricePerBag,
    magnesium_sulphate: FERTILIZERS.magnesium_sulphate.defaultPricePerBag,
    npk_13_0_45: FERTILIZERS.npk_13_0_45.defaultPricePerBag,
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currencySymbol: '₹',
  fertilizerPrices: getDefaultFertilizerPrices(),
  reminderHour: 8,
  reminderDaysBefore: 7,
};

export async function loadFields(): Promise<FarmerField[]> {
  try {
    const raw = await AsyncStorage.getItem(FIELDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFields(fields: FarmerField[]): Promise<void> {
  await AsyncStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      reminderDaysBefore:
        typeof parsed?.reminderDaysBefore === 'number' && parsed.reminderDaysBefore >= 7
          ? parsed.reminderDaysBefore
          : 7,
      fertilizerPrices: {
        ...getDefaultFertilizerPrices(),
        ...(parsed?.fertilizerPrices ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createSampleFields(): FarmerField[] {
  const today = getTodayISO();
  const wheatSowing = addDaysISO(today, -19); // CRI stage due in 2 days!
  const chickpeaSowing = addDaysISO(today, -3); // Basal done, branching coming up

  return [
    {
      id: `demo-wheat-${Date.now()}`,
      name: 'North Plot (Wheat)',
      cropId: 'wheat',
      sowingDate: wheatSowing,
      areaValue: 2.5,
      areaUnit: 'acre',
      completedStageIds: ['wheat_basal'],
      completedDates: { wheat_basal: wheatSowing },
      remindersEnabled: true,
      notes: 'Rabi season timely sowing',
      createdAt: new Date().toISOString(),
    },
    {
      id: `demo-chickpea-${Date.now() + 1}`,
      name: 'East Field (Chickpea)',
      cropId: 'chickpea',
      sowingDate: chickpeaSowing,
      areaValue: 1,
      areaUnit: 'hectare',
      completedStageIds: ['chickpea_basal'],
      completedDates: { chickpea_basal: chickpeaSowing },
      remindersEnabled: true,
      notes: 'Desi chana plot',
      createdAt: new Date().toISOString(),
    },
  ];
}
