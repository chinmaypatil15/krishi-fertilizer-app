import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pickText } from '../i18n/translations';
import { AppSettings, FieldSummary } from '../types';
import { addDaysISO, parseISODate } from './calculations';

export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function cancelFieldNotifications(fieldId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matching = scheduled.filter(
      (n) => (n.content.data as { fieldId?: string } | undefined)?.fieldId === fieldId
    );
    await Promise.all(
      matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Ignore if notifications are unavailable in current runtime
  }
}

export async function syncFieldNotifications(
  summary: FieldSummary,
  settings: AppSettings
): Promise<number> {
  if (Platform.OS === 'web') return 0;

  await cancelFieldNotifications(summary.field.id);
  if (!summary.field.remindersEnabled) return 0;

  const granted = await requestNotificationPermission();
  if (!granted) return 0;

  const now = new Date();
  const lang = settings.language;
  const cropName = pickText(lang, summary.crop.name, summary.crop.hiName, summary.crop.mrName);
  let scheduledCount = 0;

  for (const stage of summary.stages) {
    if (stage.isCompleted) continue;

    const stageTitle = pickText(lang, stage.stageName, stage.hiStageName, stage.mrStageName);
    const summaryDose = stage.items
      .map((i) => `${pickText(lang, i.name, i.hiName, i.mrName)}: ${i.kgAmount} kg`)
      .join(', ');

    const reminderWindow = Math.max(7, settings.reminderDaysBefore || 7);

    // Schedule daily reminders starting from a week before (7 days down to 0 - Due Today)
    for (let daysBefore = reminderWindow; daysBefore >= 0; daysBefore--) {
      const notifIso = addDaysISO(stage.scheduledDate, -daysBefore);
      const notifDate = parseISODate(notifIso);
      notifDate.setHours(settings.reminderHour, 0, 0, 0);

      // Only schedule if this date & hour is in the future
      if (notifDate.getTime() <= now.getTime()) continue;

      let title = '';
      let adviceSuffix = '';

      if (daysBefore === 0) {
        title = pickText(
          lang,
          `🌾 Fertilizer Due Today: ${summary.field.name}`,
          `🌾 आज खाद डालें: ${summary.field.name}`,
          `🌾 आज खत द्या: ${summary.field.name}`
        );
        adviceSuffix = pickText(
          lang,
          '\nApply scheduled dose today.',
          '\nआज निर्धारित खाद खेत में डालें।',
          '\nआज ठरलेली खत मात्रा शेतात द्या.'
        );
      } else if (daysBefore === 1) {
        title = pickText(
          lang,
          `📅 Upcoming Fertilizer Tomorrow: ${summary.field.name}`,
          `📅 कल खाद डालनी है: ${summary.field.name}`,
          `📅 उद्या खत द्यायचे आहे: ${summary.field.name}`
        );
        adviceSuffix = pickText(
          lang,
          '\nKeep equipment & water ready.',
          '\nउपकरण व पानी तैयार रखें।',
          '\nसाहित्य व पाण्याची सोय तयार ठेवा.'
        );
      } else if (daysBefore === 7) {
        title = pickText(
          lang,
          `🌾 Fertilizer in 1 Week (7 Days): ${summary.field.name}`,
          `🌾 1 सप्ताह (7 दिन) में खाद देनी है: ${summary.field.name}`,
          `🌾 १ आठवड्यात (७ दिवस) खत द्यायचे आहे: ${summary.field.name}`
        );
        adviceSuffix = pickText(
          lang,
          '\nArrange required bags in advance.',
          '\nआवश्यक खाद की व्यवस्था पहले से कर लें।',
          '\nलागणारी खते आधीच खरेदी करून ठेवा.'
        );
      } else {
        title = pickText(
          lang,
          `⏳ Fertilizer in ${daysBefore} Days: ${summary.field.name}`,
          `⏳ ${daysBefore} दिन में खाद डालनी है: ${summary.field.name}`,
          `⏳ ${daysBefore} दिवसांत खत द्यायचे आहे: ${summary.field.name}`
        );
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: `${cropName} • ${stageTitle}${daysBefore > 0 ? ` (${daysBefore} ${pickText(lang, 'days left', 'दिन शेष', 'दिवस बाकी')})` : ''}\n${summaryDose}${adviceSuffix}`,
          data: {
            fieldId: summary.field.id,
            stageId: stage.id,
            daysBefore,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifDate,
        },
      });
      scheduledCount += 1;
    }
  }

  return scheduledCount;
}
