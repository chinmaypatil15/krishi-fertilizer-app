import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { pickText } from '../i18n/translations';
import { FieldSummary, Language } from '../types';

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

function toIcsDateTimeLocal(isoDate: string, hour = 8, minute = 0): string {
  const d = isoDate.replace(/-/g, '');
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${d}T${hh}${mm}00`;
}

export function buildFieldIcsContent(
  summary: FieldSummary,
  lang: Language,
  currencySymbol: string
): string {
  const { field, crop, stages } = summary;
  const cropName = pickText(lang, crop.name, crop.hiName, crop.mrName);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KrishiPlan//Fertilizer Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`${field.name} - ${cropName}`)}`,
  ];

  // Sowing Day event
  lines.push(
    'BEGIN:VEVENT',
    `UID:${field.id}-sowing@krishiplan.app`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(field.sowingDate)}`,
    `SUMMARY:${escapeIcsText(`🌱 ${field.name}: ${cropName} Sowing Day`)}`,
    `DESCRIPTION:${escapeIcsText(`Area: ${field.areaValue} ${field.areaUnit}`)}`,
    'END:VEVENT'
  );

  // Fertilizer stages
  for (const st of stages) {
    const stageTitle = pickText(lang, st.stageName, st.hiStageName, st.mrStageName);
    const tipText = pickText(lang, st.tip, st.hiTip, st.mrTip);
    const itemsList = st.items
      .map((i) => {
        const fname = pickText(lang, i.name, i.hiName, i.mrName);
        return `- ${fname}: ${i.kgAmount} kg (${i.bags} bags)`;
      })
      .join('\n');

    const desc = [
      `Field: ${field.name} (${cropName})`,
      `Day ${st.daysAfterSowing} after sowing`,
      '',
      'Fertilizers:',
      itemsList,
      '',
      `Est. Cost: ${currencySymbol}${st.totalCost}`,
      `Tip: ${tipText}`,
    ].join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${field.id}-${st.id}@krishiplan.app`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${toIcsDateTimeLocal(st.scheduledDate, 8, 0)}`,
      `DTEND:${toIcsDateTimeLocal(st.scheduledDate, 9, 0)}`,
      `SUMMARY:${escapeIcsText(`🌾 ${field.name} - ${stageTitle}`)}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Fertilizer reminder 1 week before',
      'TRIGGER:-P7D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Fertilizer reminder tomorrow',
      'TRIGGER:-P1D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Fertilizer application due today',
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function exportFieldScheduleToIcs(
  summary: FieldSummary,
  lang: Language,
  currencySymbol: string
): Promise<boolean> {
  const icsContent = buildFieldIcsContent(summary, lang, currencySymbol);
  const safeName = summary.field.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'fertilizer-schedule';
  const fileName = `${safeName}-schedule.ics`;

  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(icsContent);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return false;

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/calendar',
    dialogTitle: 'Export Fertilizer Schedule (.ics)',
    UTI: 'com.apple.ical.ics',
  });
  return true;
}
