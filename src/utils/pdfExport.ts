import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { FieldSummary, Language } from '../types';
import { getLocalizedPointNum, parseAdvicePoints } from './adviceFormatter';
import {
  aggregateStageFertilizers,
  formatReadableDate,
  getTodayISO,
} from './calculations';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildFieldPdfHtml(
  summary: FieldSummary,
  lang: Language,
  currencySymbol: string
): string {
  const { field, crop, stages } = summary;
  const t = TRANSLATIONS[lang];
  const cropName = pickText(lang, crop.name, crop.hiName, crop.mrName);
  const seasonLabel = pickText(lang, crop.season, crop.hiSeason, crop.mrSeason);
  const todayReadable = formatReadableDate(getTodayISO(), lang);
  const sowingReadable = formatReadableDate(field.sowingDate, lang);
  const totalBagsList = aggregateStageFertilizers(stages);

  const reportTitle = pickText(
    lang,
    'Fertilizer Schedule & Nutrient Management Report',
    'उर्वरक एवं पोषण प्रबंधन रिपोर्ट',
    'खत नियोजन व पीक पोषण व्यवस्थापन अहवाल'
  );

  const farmDetailsTitle = pickText(
    lang,
    'Farm & Crop Profile',
    'खेत एवं फसल विवरण',
    'शेत व पीक तपशील'
  );

  const execSummaryTitle = pickText(
    lang,
    'Executive Nutrition & Cost Summary',
    'पोषण एवं खर्च सारांश',
    'खत पोषण व एकूण खर्च सारांश'
  );

  const totalReqTitle = pickText(
    lang,
    'Total Season Fertilizer Requirement',
    'पूरे सीजन की कुल खाद आवश्यकता',
    'संपूर्ण हंगामाची एकूण खत आवश्यकता'
  );

  const timelineTitle = pickText(
    lang,
    'Stage-by-Stage Fertilizer Timeline & Advisory',
    'चरणबद्ध खाद समय-सारणी एवं कृषि सलाह',
    'टप्प्याटप्प्याने खतांचे वेळापत्रक व कृषी सल्ला'
  );

  const disclaimerText = pickText(
    lang,
    'Advisory Disclaimer: Fertilizer dosage recommendations follow established agricultural university & ICAR standards. Please adjust doses according to your Soil Health Card (SHC) report and local Krishi Vigyan Kendra (KVK) guidelines.',
    'कृषि सलाह अस्वीकरण: उर्वरक अनुशंसाएँ कृषि विश्वविद्यालयों एवं ICAR मानकों पर आधारित हैं। अपनी मृदा स्वास्थ्य पत्रिका (Soil Health Card) व नजदीकी कृषि विज्ञान केंद्र की सलाह अनुसार मात्रा में उचित फेरबदल करें।',
    'कृषी सल्ला सूचना: खतांची ही मात्रा कृषी विद्यापीठांच्या प्रमाणकांवर आधारित आहे. आपल्या शेतातील माती परीक्षण अहवाल (Soil Health Card) व स्थानिक कृषी विज्ञान केंद्राच्या सल्ल्यानुसार आवश्यकतेनुसार बदल करावा.'
  );

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(field.name)} - ${escapeHtml(reportTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Mangal", "Arial Unicode MS", sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 14pt;
      line-height: 1.5;
      padding: 0;
    }

    /* Header Banner */
    .header-banner {
      background: linear-gradient(135deg, #15803d 0%, #166534 100%);
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .header-subtitle {
      font-size: 13pt;
      color: #bbf7d0;
      margin-top: 4px;
    }
    .header-badge {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.35);
      padding: 8px 14px;
      border-radius: 6px;
      text-align: right;
      font-size: 12pt;
      line-height: 1.4;
    }

    /* Grid layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    /* Section Cards */
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      background: #ffffff;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .card-title {
      font-size: 15pt;
      font-weight: 700;
      color: #111827;
      border-bottom: 1.5px solid #f3f4f6;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Meta Details List */
    .meta-list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .meta-item {
      background: #f9fafb;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #f3f4f6;
    }
    .meta-label {
      font-size: 11pt;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .meta-value {
      font-size: 14pt;
      font-weight: 700;
      color: #111827;
      margin-top: 3px;
    }

    /* Stat Highlight Boxes */
    .stat-box {
      border-radius: 8px;
      padding: 14px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .stat-cost {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .stat-cost-val {
      font-size: 20pt;
      font-weight: 800;
      color: #15803d;
    }
    .stat-npk-val {
      font-size: 14pt;
      font-weight: 700;
      color: #1f2937;
      margin-top: 5px;
    }
    .npk-pill-n { color: #15803d; font-weight: 800; }
    .npk-pill-p { color: #0284c7; font-weight: 800; }
    .npk-pill-k { color: #d97706; font-weight: 800; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5pt;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12.5pt;
      text-transform: uppercase;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
      font-size: 13.5pt;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .tr-total td {
      background: #f0fdf4 !important;
      font-weight: 800;
      border-top: 2px solid #86efac;
      color: #166534;
      font-size: 14.5pt;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }

    /* Timeline Stages */
    .stage-card {
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .stage-card-done {
      border-color: #86efac;
      background: #fafdfb;
    }
    .stage-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .stage-name {
      font-size: 15pt;
      font-weight: 800;
      color: #111827;
    }
    .stage-phase {
      font-size: 12.5pt;
      color: #6b7280;
      font-weight: 600;
      margin-top: 3px;
    }
    .stage-badge {
      display: inline-block;
      font-size: 11.5pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .badge-done {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-scheduled {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;
    }
    .badge-due {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    /* Alternative Callout */
    .alt-callout {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 10px 12px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      font-size: 13pt;
      line-height: 1.45;
      color: #92400e;
    }
    .alt-callout strong {
      color: #b45309;
      display: block;
      margin-bottom: 3px;
      font-size: 13.5pt;
    }

    /* Advisory Box */
    .advisory-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-top: 10px;
      font-size: 13pt;
      line-height: 1.45;
      color: #334155;
    }
    .advisory-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .advisory-points-list {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .advisory-point-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13pt;
      line-height: 1.45;
      color: #334155;
    }
    .advisory-point-num {
      font-weight: 800;
      color: #0f766e;
      min-width: 24px;
      flex-shrink: 0;
    }
    .advisory-point-text {
      flex: 1;
    }
    .advisory-paragraph {
      font-size: 13pt;
      line-height: 1.45;
      color: #334155;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 20px;
      font-size: 11pt;
      line-height: 1.45;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Header Banner -->
  <div class="header-banner">
    <div>
      <div class="header-title">🌾 ${escapeHtml(reportTitle)}</div>
      <div class="header-subtitle">Krishi Fertilizer Planner • Scientific Nutrient Schedule</div>
    </div>
    <div class="header-badge">
      <div><strong>${escapeHtml(pickText(lang, 'Generated', 'दिनांक', 'दिनांक'))}:</strong> ${escapeHtml(todayReadable)}</div>
      <div><strong>${escapeHtml(pickText(lang, 'Language', 'भाषा', 'भाषा'))}:</strong> ${lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English'}</div>
    </div>
  </div>

  <!-- Farm & Crop Profile -->
  <div class="card">
    <div class="card-title">
      <span>🚜 ${escapeHtml(farmDetailsTitle)}</span>
      <span style="font-size: 11.5pt; color: #6b7280; font-weight: normal;">ID: ${escapeHtml(field.id)}</span>
    </div>
    <div class="meta-list">
      <div class="meta-item">
        <div class="meta-label">${escapeHtml(t.common.fieldName)}</div>
        <div class="meta-value">${escapeHtml(field.name)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">${escapeHtml(t.common.crop)}</div>
        <div class="meta-value">${escapeHtml(crop.emoji)} ${escapeHtml(cropName)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">${escapeHtml(t.common.area)}</div>
        <div class="meta-value">${field.areaValue} ${escapeHtml(t.units[field.areaUnit])} <span style="font-size: 11.5pt; color: #6b7280;">(${summary.areaInAcres} ac)</span></div>
      </div>
      <div class="meta-item">
        <div class="meta-label">${escapeHtml(t.common.sowingDate)}</div>
        <div class="meta-value">${escapeHtml(sowingReadable)}</div>
      </div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="grid-3">
    <div class="stat-box stat-cost">
      <div class="meta-label" style="color: #15803d;">${escapeHtml(pickText(lang, 'Total Estimated Cost', 'कुल अनुमानित खर्च', 'एकूण अंदाजित खत खर्च'))}</div>
      <div class="stat-cost-val">${escapeHtml(currencySymbol)} ${summary.plannedCost.toLocaleString()}</div>
      <div style="font-size: 11.5pt; color: #166534; margin-top: 4px;">
        ${summary.spentCost > 0 ? `${escapeHtml(t.detail.spentLabel)}: ${escapeHtml(currencySymbol)}${summary.spentCost.toLocaleString()}` : `${escapeHtml(pickText(lang, 'For whole crop cycle', 'पूरी फसल अवधि के लिए', 'संपूर्ण पीक कालावधीसाठी'))}`}
      </div>
    </div>

    <div class="stat-box">
      <div class="meta-label">${escapeHtml(pickText(lang, 'Planned Nutrient Balance', 'संतुलित N-P-K पोषण', 'नियोजित संतुलित N-P-K मात्रा'))}</div>
      <div class="stat-npk-val">
        <span class="npk-pill-n">N: ${summary.plannedNpk.n}kg</span> • 
        <span class="npk-pill-p">P: ${summary.plannedNpk.p}kg</span> • 
        <span class="npk-pill-k">K: ${summary.plannedNpk.k}kg</span>
      </div>
      <div style="font-size: 11.5pt; color: #6b7280; margin-top: 4px;">
        ${escapeHtml(pickText(lang, 'Essential Macronutrients (kg)', 'मुख्य पोषक तत्व (किग्रा)', 'आवश्यक मुख्य अन्नद्रव्ये (किलो)'))}
      </div>
    </div>

    <div class="stat-box">
      <div class="meta-label">${escapeHtml(pickText(lang, 'Application Progress', 'खुराक प्रगति', 'खत मात्रा प्रगती'))}</div>
      <div style="font-size: 18pt; font-weight: 800; color: #111827; margin-top: 4px;">
        ${summary.completedCount} / ${stages.length}
      </div>
      <div style="font-size: 11.5pt; color: #6b7280; margin-top: 4px;">
        ${summary.completedCount === stages.length ? escapeHtml(t.fields.allDone) : summary.nextStage ? `${escapeHtml(t.fields.nextDose)}: ${escapeHtml(pickText(lang, summary.nextStage.stageName, summary.nextStage.hiStageName, summary.nextStage.mrStageName))}` : ''}
      </div>
    </div>
  </div>

  <!-- Total Fertilizer Requirements Table -->
  <div class="card">
    <div class="card-title">
      <span>📦 ${escapeHtml(totalReqTitle)}</span>
      <span style="font-size: 12pt; color: #6b7280; font-weight: normal;">${escapeHtml(seasonLabel)} Season</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th>${escapeHtml(pickText(lang, 'Fertilizer Name', 'उर्वरक का नाम', 'खताचे नाव'))}</th>
          <th class="text-right">${escapeHtml(pickText(lang, 'Total Weight', 'कुल मात्रा', 'एकूण वजन'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Bags / Bottles', 'बैग / बोतल संख्या', 'गोण्या / बाटल्या संख्या'))}</th>
          <th class="text-right">${escapeHtml(pickText(lang, 'Estimated Cost', 'अनुमानित लागत', 'अंदाजित किंमत'))}</th>
        </tr>
      </thead>
      <tbody>
        ${totalBagsList
          .map((item, idx) => {
            const fname = pickText(lang, item.name, item.hiName, item.mrName);
            const unitLabel = item.isBottle
              ? item.totalBags === 1
                ? t.alternatives.bottle
                : t.alternatives.bottles
              : item.totalBags === 1
              ? t.common.bag
              : t.common.bags;
            return `<tr>
              <td class="text-center" style="color: #9ca3af;">${idx + 1}</td>
              <td><strong>${escapeHtml(fname)}</strong></td>
              <td class="text-right">${item.totalKg} ${escapeHtml(t.common.kg)}</td>
              <td class="text-center"><strong>${item.totalBags}</strong> ${escapeHtml(unitLabel)} <span style="font-size: 11pt; color: #6b7280;">(${item.bagWeightKg}kg)</span></td>
              <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${item.totalCost.toLocaleString()}</strong></td>
            </tr>`;
          })
          .join('')}
        <tr class="tr-total">
          <td colspan="4" class="text-right">${escapeHtml(pickText(lang, 'TOTAL ESTIMATED INVESTMENT', 'कुल अनुमानित उर्वरक लागत', 'एकूण अंदाजित खत गुंतवणूक'))}:</td>
          <td class="text-right">${escapeHtml(currencySymbol)} ${summary.plannedCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Stage-by-Stage Timeline & Advisory -->
  <div style="margin-top: 16px; margin-bottom: 8px;">
    <h3 style="font-size: 16pt; font-weight: 800; color: #111827; border-bottom: 2px solid #15803d; padding-bottom: 6px; margin-bottom: 14px;">
      🗓️ ${escapeHtml(timelineTitle)}
    </h3>

    ${stages
      .map((st, idx) => {
        const stageName = pickText(lang, st.stageName, st.hiStageName, st.mrStageName);
        const growthPhase = pickText(lang, st.growthPhase, st.hiGrowthPhase, st.mrGrowthPhase);
        const tipText = pickText(lang, st.tip, st.hiTip, st.mrTip);
        const scheduledDateText = formatReadableDate(st.scheduledDate, lang);

        const statusBadgeClass = st.isCompleted
          ? 'badge-done'
          : st.status === 'due_today' || st.status === 'overdue'
          ? 'badge-due'
          : 'badge-scheduled';

        const statusBadgeLabel = st.isCompleted
          ? `✓ ${escapeHtml(t.status.completed)}${st.completedOn ? ` (${formatReadableDate(st.completedOn, lang)})` : ''}`
          : escapeHtml(t.status[st.status]);

        const hasAlternative = !!st.activeAlternativeTitle;
        const altTitle = hasAlternative
          ? pickText(
              lang,
              st.activeAlternativeTitle ?? '',
              st.hiActiveAlternativeTitle ?? st.activeAlternativeTitle ?? '',
              st.mrActiveAlternativeTitle
            )
          : '';
        const altNote = hasAlternative
          ? pickText(
              lang,
              st.activeAlternativeNote ?? '',
              st.hiActiveAlternativeNote ?? st.activeAlternativeNote ?? '',
              st.mrActiveAlternativeNote
            )
          : '';

        return `<div class="stage-card ${st.isCompleted ? 'stage-card-done' : ''}">
          <div class="stage-header">
            <div>
              <span style="font-size: 12pt; font-weight: 700; color: #15803d; text-transform: uppercase;">
                ${escapeHtml(pickText(lang, `Stage ${idx + 1}`, `चरण ${idx + 1}`, `टप्पा ${idx + 1}`))} • ${escapeHtml(t.common.day)} ${st.daysAfterSowing} (${escapeHtml(scheduledDateText)})
              </span>
              <div class="stage-name">${escapeHtml(stageName)}</div>
              <div class="stage-phase">🌱 ${escapeHtml(growthPhase)}</div>
            </div>
            <div class="stage-badge ${statusBadgeClass}">
              ${statusBadgeLabel}
            </div>
          </div>

          ${
            hasAlternative
              ? (() => {
                  const altParsed = parseAdvicePoints(altNote);
                  return `<div class="alt-callout">
                    <strong>🔄 ${escapeHtml(t.alternatives.activeBadge)}: ${escapeHtml(altTitle)}</strong>
                    ${
                      altParsed.isList
                        ? `<div class="advisory-points-list" style="margin-top: 5px;">
                            ${altParsed.points
                              .map(
                                (pt, pIdx) => `<div class="advisory-point-item" style="color: #92400e;">
                                  <span class="advisory-point-num" style="color: #b45309;">${getLocalizedPointNum(pIdx + 1, lang)}.</span>
                                  <div class="advisory-point-text">${escapeHtml(pt)}</div>
                                </div>`
                              )
                              .join('')}
                          </div>`
                        : `<div>${escapeHtml(altNote)}</div>`
                    }
                  </div>`;
                })()
              : ''
          }

          <table style="margin: 8px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th>${escapeHtml(pickText(lang, 'Application Fertilizer', 'खाद का नाम', 'खताचे नाव'))}</th>
                <th class="text-right">${escapeHtml(pickText(lang, 'Quantity', 'मात्रा', 'प्रमाण'))}</th>
                <th class="text-center">${escapeHtml(pickText(lang, 'Bags / Bottles', 'बैग / बोतल', 'गोण्या / बाटल्या'))}</th>
                <th class="text-right">${escapeHtml(pickText(lang, 'Estimated Cost', 'अनुमानित लागत', 'अंदाजित किंमत'))}</th>
              </tr>
            </thead>
            <tbody>
              ${st.items
                .map((item) => {
                  const fname = pickText(lang, item.name, item.hiName, item.mrName);
                  const unitWord = item.isBottle
                    ? item.bags === 1
                      ? t.alternatives.bottle
                      : t.alternatives.bottles
                    : item.bags === 1
                    ? t.common.bag
                    : t.common.bags;
                  return `<tr>
                    <td><strong>${escapeHtml(fname)}</strong></td>
                    <td class="text-right">${item.kgAmount} ${escapeHtml(t.common.kg)}</td>
                    <td class="text-center">${item.bags} ${escapeHtml(unitWord)}</td>
                    <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${item.estimatedCost.toLocaleString()}</strong></td>
                  </tr>`;
                })
                .join('')}
              <tr style="font-weight: 700; background: #fafafa;">
                <td colspan="2" style="font-size: 11.5pt;">
                  <span class="npk-pill-n">N: ${st.totalNpk.n}kg</span> • 
                  <span class="npk-pill-p">P: ${st.totalNpk.p}kg</span> • 
                  <span class="npk-pill-k">K: ${st.totalNpk.k}kg</span>
                </td>
                <td class="text-right" style="font-size: 12pt; color: #6b7280;">${escapeHtml(pickText(lang, 'Stage Total', 'चरण का खर्च', 'टप्प्याचा एकूण खर्च'))}:</td>
                <td class="text-right" style="color: #15803d; font-size: 14pt;">${escapeHtml(currencySymbol)} ${st.totalCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="advisory-box">
            <div class="advisory-title">
              💡 ${escapeHtml(pickText(lang, 'Expert Agronomic Advice', 'कृषि वैज्ञानिक सलाह', 'तज्ज्ञ कृषी सल्ला व शिफारस'))}
            </div>
            ${(() => {
              const adviceParsed = parseAdvicePoints(tipText);
              if (adviceParsed.isList) {
                return `<div class="advisory-points-list">
                  ${adviceParsed.points
                    .map(
                      (pt, pIdx) => `<div class="advisory-point-item">
                        <span class="advisory-point-num">${getLocalizedPointNum(pIdx + 1, lang)}.</span>
                        <div class="advisory-point-text">${escapeHtml(pt)}</div>
                      </div>`
                    )
                    .join('')}
                </div>`;
              }
              return `<div class="advisory-paragraph">${escapeHtml(tipText)}</div>`;
            })()}
          </div>
        </div>`;
      })
      .join('')}
  </div>

  <!-- Disclaimer and Footer -->
  <div class="footer">
    <div style="flex: 1; padding-right: 20px;">
      ${escapeHtml(disclaimerText)}
    </div>
    <div style="text-align: right; white-space: nowrap;">
      <strong>KrishiPlan v1.0</strong><br />
      Smart Agriculture Planner
    </div>
  </div>

</body>
</html>`;
}

export async function exportFieldScheduleToPdf(
  summary: FieldSummary,
  lang: Language,
  currencySymbol: string
): Promise<boolean> {
  try {
    const html = buildFieldPdfHtml(summary, lang, currencySymbol);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    }

    const printResult = await Print.printToFileAsync({
      html,
      base64: true,
    });

    const safeName =
      summary.field.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'fertilizer-schedule';
    const fileName = `${safeName}-${Date.now()}.pdf`;

    const targetFile = new File(Paths.cache, fileName);
    targetFile.create({ overwrite: true });

    if (printResult.base64) {
      await targetFile.write(printResult.base64, { encoding: 'base64' });
    } else {
      const srcFile = new File(printResult.uri);
      await srcFile.copy(targetFile, { overwrite: true });
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      try {
        await Sharing.shareAsync(targetFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${summary.field.name} - ${summary.crop.name} Fertilizer Report`,
          UTI: 'com.adobe.pdf',
        });
        return true;
      } catch (shareErr) {
        console.warn('Sharing.shareAsync failed, attempting fallback preview/print:', shareErr);
      }
    }

    // Fallback 1: File.preview (opens in device PDF viewer / ACTION_VIEW on Android)
    try {
      const canPreview = await targetFile.canPreview();
      if (canPreview) {
        await targetFile.preview();
        return true;
      }
    } catch (previewErr) {
      console.warn('targetFile.preview failed, trying Print.printAsync:', previewErr);
    }

    // Fallback 2: Print.printAsync (opens native print dialog which includes "Save as PDF")
    await Print.printAsync({ html });
    return true;
  } catch (err) {
    console.error('Failed to export PDF:', err);
    return false;
  }
}

export function buildConsolidatedPdfHtml(
  summaries: FieldSummary[],
  lang: Language,
  currencySymbol: string,
  farmerName?: string
): string {
  const t = TRANSLATIONS[lang];
  const todayReadable = formatReadableDate(getTodayISO(), lang);

  const totalAcres = summaries.reduce((acc, s) => acc + s.areaInAcres, 0);
  const roundedAcres = Math.round(totalAcres * 10) / 10;
  const totalPlannedCost = summaries.reduce((acc, s) => acc + s.plannedCost, 0);
  const totalSpentCost = summaries.reduce((acc, s) => acc + s.spentCost, 0);

  const totalPlannedNpk = summaries.reduce(
    (acc, s) => ({
      n: Math.round((acc.n + s.plannedNpk.n) * 10) / 10,
      p: Math.round((acc.p + s.plannedNpk.p) * 10) / 10,
      k: Math.round((acc.k + s.plannedNpk.k) * 10) / 10,
    }),
    { n: 0, p: 0, k: 0 }
  );

  const allStages = summaries.flatMap((s) => s.stages);
  const masterFertilizerList = aggregateStageFertilizers(allStages);

  // Chronological list of stages across all plots
  interface ChronoItem {
    fieldId: string;
    fieldName: string;
    cropEmoji: string;
    cropName: string;
    stage: FieldSummary['stages'][number];
  }
  const chronoStages: ChronoItem[] = [];
  for (const s of summaries) {
    for (const st of s.stages) {
      chronoStages.push({
        fieldId: s.field.id,
        fieldName: s.field.name,
        cropEmoji: s.crop.emoji,
        cropName: pickText(lang, s.crop.name, s.crop.hiName, s.crop.mrName),
        stage: st,
      });
    }
  }
  chronoStages.sort((a, b) => a.stage.scheduledDate.localeCompare(b.stage.scheduledDate));

  const reportTitle = pickText(
    lang,
    'Consolidated Farm Fertilizer Schedule & Nutrient Management Report',
    'सभी खेतों का समग्र उर्वरक एवं पोषण प्रबंधन रिपोर्ट',
    'सर्व शेतांचे एकत्रित खत वेळापत्रक व अन्नद्रव्य व्यवस्थापन अहवाल'
  );

  const reportSubtitle = pickText(
    lang,
    'Complete multi-plot fertilizer requirements, master timeline & agronomic advisory',
    'समस्त फसल खेतों की कुल खाद आवश्यकता, समग्र टाइमलाइन एवं कृषि सलाह',
    'सर्व पीक शेतांची एकूण खत गरज, एकत्रित टाइमलाइन व तज्ज्ञ कृषी सल्ला'
  );

  const masterShoppingTitle = pickText(
    lang,
    'Consolidated Farm Fertilizer Shopping List (Season Total)',
    'हंगामाची एकत्रित खत खरेदी यादी (सीजन का कुल उर्वरक कोटा)',
    'हंगामाची एकत्रित खत खरेदी यादी (सर्व शेतांची एकूण खत गरज)'
  );

  const allPlotsTableTitle = pickText(
    lang,
    'All Active Plots Summary',
    'सभी सक्रिय खेतों का विवरण',
    'सर्व सक्रिय शेतांचा तपशील'
  );

  const masterTimelineTitle = pickText(
    lang,
    'Master Chronological Fertilizer Schedule (All Plots Calendar)',
    'तारीखवार समग्र खाद कैलेंडर (सभी खेत)',
    'तारीखवार एकत्रित खतांची कामे (मास्टर कॅलेंडर)'
  );

  const plotSchedulesTitle = pickText(
    lang,
    'Plot-by-Plot Comprehensive Fertilizer Timelines & Advisory',
    'खेतवार विस्तृत खाद समय-सारणी एवं कृषि सलाह',
    'प्लॉटनिहाय सविस्तर खत वेळापत्रके व कृषी सल्ला'
  );

  const disclaimerText = pickText(
    lang,
    'Advisory Disclaimer: Fertilizer dosage recommendations follow established agricultural university & ICAR standards. Please adjust doses according to your Soil Health Card (SHC) report and local Krishi Vigyan Kendra (KVK) guidelines.',
    'कृषि सलाह अस्वीकरण: उर्वरक अनुशंसाएँ कृषि विश्वविद्यालयों एवं ICAR मानकों पर आधारित हैं। अपनी मृदा स्वास्थ्य पत्रिका (Soil Health Card) व नजदीकी कृषि विज्ञान केंद्र की सलाह अनुसार मात्रा में उचित फेरबदल करें।',
    'कृषी सल्ला सूचना: खतांची ही मात्रा कृषी विद्यापीठांच्या प्रमाणकांवर आधारित आहे. आपल्या शेतातील माती परीक्षण अहवाल (Soil Health Card) व स्थानिक कृषी विज्ञान केंद्राच्या सल्ल्यानुसार आवश्यकतेनुसार बदल करावा.'
  );

  const effectiveFarmerName =
    farmerName?.trim() ||
    pickText(lang, 'Farmer Friend', 'किसान मित्र', 'शेतकरी मित्र');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)} - ${escapeHtml(effectiveFarmerName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Mangal", "Arial Unicode MS", sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 14pt;
      line-height: 1.5;
      padding: 0;
    }
    .header-banner {
      background: linear-gradient(135deg, #15803d 0%, #166534 100%);
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      font-size: 19pt;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .header-subtitle {
      font-size: 12.5pt;
      color: #bbf7d0;
      margin-top: 4px;
    }
    .header-badge {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.35);
      padding: 8px 14px;
      border-radius: 6px;
      text-align: right;
      font-size: 12pt;
      line-height: 1.4;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .stat-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      background: #f9fafb;
    }
    .stat-cost {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .stat-label {
      font-size: 11pt;
      font-weight: 700;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .stat-cost-val {
      font-size: 18pt;
      font-weight: 800;
      color: #15803d;
      margin-top: 2px;
    }
    .stat-val {
      font-size: 16pt;
      font-weight: 800;
      color: #1f2937;
      margin-top: 2px;
    }
    .npk-pill-n { color: #15803d; font-weight: 800; }
    .npk-pill-p { color: #0284c7; font-weight: 800; }
    .npk-pill-k { color: #d97706; font-weight: 800; }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      background: #ffffff;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .card-title {
      font-size: 15pt;
      font-weight: 700;
      color: #111827;
      border-bottom: 2px solid #15803d;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5pt;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12.5pt;
      text-transform: uppercase;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
      font-size: 13.5pt;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .tr-total td {
      background: #f0fdf4 !important;
      font-weight: 800;
      border-top: 2px solid #86efac;
      color: #166534;
      font-size: 14.5pt;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-done { background: #dcfce7; color: #15803d; }
    .badge-due { background: #fef3c7; color: #b45309; }
    .badge-scheduled { background: #f3f4f6; color: #4b5563; }
    .stage-card {
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .stage-card-done {
      border-color: #86efac;
      background: #fafdfb;
    }
    .stage-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .stage-name {
      font-size: 15pt;
      font-weight: 800;
      color: #111827;
      margin: 2px 0;
    }
    .stage-phase {
      font-size: 12pt;
      color: #4b5563;
      font-weight: 500;
    }
    .advisory-box {
      margin-top: 10px;
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      border-radius: 0 6px 6px 0;
      padding: 10px 14px;
      font-size: 13.5pt;
      color: #14532d;
    }
    .advisory-title {
      font-weight: 700;
      font-size: 12.5pt;
      color: #15803d;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .advisory-points-list {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .advisory-point-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.5;
    }
    .advisory-point-num {
      font-weight: 800;
      color: #16a34a;
      min-width: 22px;
    }
    .advisory-point-text {
      flex: 1;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 11pt;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      page-break-inside: avoid;
    }
    .plot-section-header {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 20px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    .plot-section-title {
      font-size: 16pt;
      font-weight: 800;
      color: #166534;
    }
    .plot-section-meta {
      font-size: 12pt;
      color: #15803d;
      margin-top: 2px;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- Master Header Banner -->
  <div class="header-banner">
    <div>
      <div class="header-title">🌾 ${escapeHtml(reportTitle)}</div>
      <div class="header-subtitle">${escapeHtml(reportSubtitle)}</div>
    </div>
    <div class="header-badge">
      <strong>👨‍🌾 ${escapeHtml(effectiveFarmerName)}</strong><br />
      ${summaries.length} ${escapeHtml(pickText(lang, 'Active Plots', 'सक्रिय खेत', 'सक्रिय शेते'))} • ${roundedAcres} ${escapeHtml(pickText(lang, 'Acres', 'एकड़', 'एकर'))}<br />
      📅 ${escapeHtml(todayReadable)}
    </div>
  </div>

  <!-- Farm Executive Summary (KPIs) -->
  <div class="grid-3">
    <div class="stat-box stat-cost">
      <div class="stat-label">${escapeHtml(pickText(lang, 'Total Farm Budget', 'कुल अनुमानित खर्च', 'एकूण अंदाजित खत खर्च'))}</div>
      <div class="stat-cost-val">${escapeHtml(currencySymbol)} ${totalPlannedCost.toLocaleString()}</div>
      <div style="font-size: 11pt; color: #4b5563; margin-top: 3px;">
        ${escapeHtml(pickText(lang, 'Spent so far', 'अब तक खर्च', 'आतापर्यंत खर्च'))}: <strong>${escapeHtml(currencySymbol)} ${totalSpentCost.toLocaleString()}</strong>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-label">${escapeHtml(pickText(lang, 'Total Farm Area', 'कुल खेत क्षेत्रफल', 'एकूण शेत क्षेत्रफळ'))}</div>
      <div class="stat-val">${roundedAcres} ${escapeHtml(pickText(lang, 'Acres', 'एकड़', 'एकर'))}</div>
      <div style="font-size: 11pt; color: #4b5563; margin-top: 3px;">
        ${summaries.length} ${escapeHtml(pickText(lang, 'Sown Plots', 'बोए गए खेत', 'पेरणी केलेले प्लॉट्स'))}
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-label">${escapeHtml(pickText(lang, 'Season NPK Nutrients', 'सीजन पोषण (NPK)', 'हंगाम एकूण NPK पोषण'))}</div>
      <div style="margin-top: 4px; font-size: 12pt;">
        <span class="npk-pill-n">N: ${totalPlannedNpk.n}kg</span> • 
        <span class="npk-pill-p">P: ${totalPlannedNpk.p}kg</span> • 
        <span class="npk-pill-k">K: ${totalPlannedNpk.k}kg</span>
      </div>
      <div style="font-size: 11pt; color: #6b7280; margin-top: 3px;">
        ${escapeHtml(pickText(lang, 'Target Planned Nutrition', 'नियोजित कुल पोषण', 'नियोजित एकूण पोषण'))}
      </div>
    </div>
  </div>

  <!-- Section 1: All Plots Overview Table -->
  <div class="card">
    <div class="card-title">🚜 ${escapeHtml(allPlotsTableTitle)}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 32px;" class="text-center">#</th>
          <th>${escapeHtml(pickText(lang, 'Plot Name', 'खेत का नाम', 'प्लॉटचे नाव'))}</th>
          <th>${escapeHtml(pickText(lang, 'Crop & Season', 'फसल एवं सीजन', 'पीक व हंगाम'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Sowing Date', 'बुवाई तारीख', 'पेरणी तारीख'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Area', 'क्षेत्रफल', 'क्षेत्रफळ'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Doses Applied', 'खाद चरण', 'हप्ते पूर्ण'))}</th>
          <th class="text-right">${escapeHtml(pickText(lang, 'Est. Cost', 'अनुमानित लागत', 'अंदाजित खर्च'))}</th>
        </tr>
      </thead>
      <tbody>
        ${summaries
          .map((s, idx) => {
            const cropName = pickText(lang, s.crop.name, s.crop.hiName, s.crop.mrName);
            const seasonLabel = pickText(lang, s.crop.season, s.crop.hiSeason, s.crop.mrSeason);
            const sowingDateText = formatReadableDate(s.field.sowingDate, lang);
            return `<tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${escapeHtml(s.field.name)}</strong></td>
              <td>${s.crop.emoji} ${escapeHtml(cropName)} <span style="font-size: 11pt; color: #6b7280;">(${escapeHtml(seasonLabel)})</span></td>
              <td class="text-center">${escapeHtml(sowingDateText)}</td>
              <td class="text-center"><strong>${s.field.areaValue}</strong> ${escapeHtml(t.units[s.field.areaUnit])}</td>
              <td class="text-center"><strong>${s.completedCount}</strong> / ${s.stages.length}</td>
              <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${s.plannedCost.toLocaleString()}</strong></td>
            </tr>`;
          })
          .join('')}
        <tr class="tr-total">
          <td colspan="4" class="text-right">${escapeHtml(pickText(lang, 'TOTAL FARM INVESTMENT', 'कुल खेत उर्वरक बजट', 'सर्व शेतांचा एकूण खत खर्च'))}:</td>
          <td class="text-center">${roundedAcres} ${escapeHtml(pickText(lang, 'Acres', 'एकड़', 'एकर'))}</td>
          <td class="text-center">${summaries.reduce((acc, s) => acc + s.completedCount, 0)} / ${allStages.length}</td>
          <td class="text-right">${escapeHtml(currencySymbol)} ${totalPlannedCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Section 2: Master Consolidated Fertilizer Shopping List -->
  <div class="card">
    <div class="card-title">🛒 ${escapeHtml(masterShoppingTitle)}</div>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(pickText(lang, 'Fertilizer Name', 'खाद का नाम', 'खताचे नाव'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Total Quantity', 'कुल मात्रा', 'एकूण प्रमाण'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Total Bags / Bottles', 'कुल बैग / बोतल', 'एकूण गोण्या / बाटल्या'))}</th>
          <th class="text-right">${escapeHtml(pickText(lang, 'Estimated Budget', 'अनुमानित बजट', 'अंदाजित एकूण किंमत'))}</th>
        </tr>
      </thead>
      <tbody>
        ${masterFertilizerList
          .map((item) => {
            const fname = pickText(lang, item.name, item.hiName, item.mrName);
            const unitLabel = item.isBottle
              ? item.totalBags === 1
                ? t.alternatives.bottle
                : t.alternatives.bottles
              : item.totalBags === 1
              ? t.common.bag
              : t.common.bags;
            return `<tr>
              <td><strong>${escapeHtml(fname)}</strong></td>
              <td class="text-center"><strong>${item.totalKg}</strong> ${escapeHtml(t.common.kg)}</td>
              <td class="text-center"><strong>${item.totalBags}</strong> ${escapeHtml(unitLabel)} <span style="font-size: 11pt; color: #6b7280;">(${item.bagWeightKg}kg)</span></td>
              <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${item.totalCost.toLocaleString()}</strong></td>
            </tr>`;
          })
          .join('')}
        <tr class="tr-total">
          <td colspan="3" class="text-right">${escapeHtml(pickText(lang, 'GRAND TOTAL CONSOLIDATED INVESTMENT', 'समस्त खाद कुल अनुमानित लागत', 'एकूण सर्व शेतांची खत खरेदी गुंतवणूक'))}:</td>
          <td class="text-right">${escapeHtml(currencySymbol)} ${totalPlannedCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Section 3: Master Chronological Fertilizer Schedule -->
  <div class="card">
    <div class="card-title">📅 ${escapeHtml(masterTimelineTitle)}</div>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(pickText(lang, 'Scheduled Date', 'तारीख', 'तारीख'))}</th>
          <th>${escapeHtml(pickText(lang, 'Plot & Crop', 'खेत व फसल', 'शेत व पीक'))}</th>
          <th>${escapeHtml(pickText(lang, 'Stage & Growth Phase', 'खाद चरण', 'खताचा टप्पा'))}</th>
          <th>${escapeHtml(pickText(lang, 'Required Fertilizers', 'खाद की मात्रा', 'खतांचे प्रमाण'))}</th>
          <th class="text-right">${escapeHtml(pickText(lang, 'Cost', 'लागत', 'किंमत'))}</th>
          <th class="text-center">${escapeHtml(pickText(lang, 'Status', 'स्थिति', 'स्थिती'))}</th>
        </tr>
      </thead>
      <tbody>
        ${chronoStages
          .map((item) => {
            const st = item.stage;
            const stageName = pickText(lang, st.stageName, st.hiStageName, st.mrStageName);
            const scheduledDateText = formatReadableDate(st.scheduledDate, lang);
            const fertNames = st.items
              .map((it) => `${pickText(lang, it.name, it.hiName, it.mrName)} (${it.kgAmount}kg)`)
              .join(', ');

            const statusClass = st.isCompleted
              ? 'badge-done'
              : st.status === 'due_today' || st.status === 'overdue'
              ? 'badge-due'
              : 'badge-scheduled';

            const statusLabel = st.isCompleted
              ? `✓ ${escapeHtml(t.status.completed)}`
              : escapeHtml(t.status[st.status]);

            return `<tr>
              <td><strong>${escapeHtml(scheduledDateText)}</strong><br /><span style="font-size: 11pt; color: #6b7280;">${escapeHtml(t.common.day)} ${st.daysAfterSowing}</span></td>
              <td><strong>${escapeHtml(item.fieldName)}</strong><br /><span style="font-size: 11.5pt; color: #15803d;">${item.cropEmoji} ${escapeHtml(item.cropName)}</span></td>
              <td><strong>${escapeHtml(stageName)}</strong><br /><span style="font-size: 11pt; color: #6b7280;">🌱 ${escapeHtml(pickText(lang, st.growthPhase, st.hiGrowthPhase, st.mrGrowthPhase))}</span></td>
              <td style="font-size: 12.5pt;">${escapeHtml(fertNames)}</td>
              <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${st.totalCost.toLocaleString()}</strong></td>
              <td class="text-center"><span class="badge ${statusClass}">${statusLabel}</span></td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>

  <!-- Section 4: Plot-by-Plot Comprehensive Timelines & Advisory -->
  <div style="margin-top: 18px;">
    <h3 style="font-size: 16pt; font-weight: 800; color: #111827; border-bottom: 2px solid #15803d; padding-bottom: 6px; margin-bottom: 14px;">
      🌾 ${escapeHtml(plotSchedulesTitle)}
    </h3>

    ${summaries
      .map((s, pIdx) => {
        const cropName = pickText(lang, s.crop.name, s.crop.hiName, s.crop.mrName);
        const seasonLabel = pickText(lang, s.crop.season, s.crop.hiSeason, s.crop.mrSeason);
        const sowingDateText = formatReadableDate(s.field.sowingDate, lang);

        return `<div style="page-break-before: ${pIdx > 0 ? 'always' : 'auto'}; margin-bottom: 18px;">
          <div class="plot-section-header">
            <div class="plot-section-title">
              ${pIdx + 1}. ${s.crop.emoji} ${escapeHtml(s.field.name)} — ${escapeHtml(cropName)}
            </div>
            <div class="plot-section-meta">
              ${escapeHtml(pickText(lang, 'Area', 'क्षेत्रफल', 'क्षेत्रफळ'))}: ${s.field.areaValue} ${escapeHtml(t.units[s.field.areaUnit])} (${s.areaInAcres} ac) • 
              ${escapeHtml(pickText(lang, 'Sowing Date', 'बुवाई तारीख', 'पेरणी तारीख'))}: ${escapeHtml(sowingDateText)} • 
              ${escapeHtml(seasonLabel)} • 
              ${escapeHtml(pickText(lang, 'Planned Budget', 'अनुमानित बजट', 'नियोजित खर्च'))}: ${escapeHtml(currencySymbol)} ${s.plannedCost.toLocaleString()}
            </div>
          </div>

          ${s.stages
            .map((st, idx) => {
              const stageName = pickText(lang, st.stageName, st.hiStageName, st.mrStageName);
              const growthPhase = pickText(lang, st.growthPhase, st.hiGrowthPhase, st.mrGrowthPhase);
              const tipText = pickText(lang, st.tip, st.hiTip, st.mrTip);
              const scheduledDateText = formatReadableDate(st.scheduledDate, lang);

              const statusBadgeClass = st.isCompleted
                ? 'badge-done'
                : st.status === 'due_today' || st.status === 'overdue'
                ? 'badge-due'
                : 'badge-scheduled';

              const statusBadgeLabel = st.isCompleted
                ? `✓ ${escapeHtml(t.status.completed)}${st.completedOn ? ` (${formatReadableDate(st.completedOn, lang)})` : ''}`
                : escapeHtml(t.status[st.status]);

              return `<div class="stage-card ${st.isCompleted ? 'stage-card-done' : ''}">
                <div class="stage-header">
                  <div>
                    <span style="font-size: 11.5pt; font-weight: 700; color: #15803d; text-transform: uppercase;">
                      ${escapeHtml(pickText(lang, `Stage ${idx + 1}`, `चरण ${idx + 1}`, `टप्पा ${idx + 1}`))} • ${escapeHtml(t.common.day)} ${st.daysAfterSowing} (${escapeHtml(scheduledDateText)})
                    </span>
                    <div class="stage-name">${escapeHtml(stageName)}</div>
                    <div class="stage-phase">🌱 ${escapeHtml(growthPhase)}</div>
                  </div>
                  <div class="badge ${statusBadgeClass}">${statusBadgeLabel}</div>
                </div>

                <table style="margin: 6px 0;">
                  <thead>
                    <tr style="background: #f8fafc;">
                      <th>${escapeHtml(pickText(lang, 'Fertilizer', 'खाद', 'खत'))}</th>
                      <th class="text-right">${escapeHtml(pickText(lang, 'Quantity', 'मात्रा', 'प्रमाण'))}</th>
                      <th class="text-center">${escapeHtml(pickText(lang, 'Bags / Bottles', 'बैग / बोतल', 'गोण्या / बाटल्या'))}</th>
                      <th class="text-right">${escapeHtml(pickText(lang, 'Cost', 'लागत', 'किंमत'))}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${st.items
                      .map((item) => {
                        const fname = pickText(lang, item.name, item.hiName, item.mrName);
                        const unitWord = item.isBottle
                          ? item.bags === 1
                            ? t.alternatives.bottle
                            : t.alternatives.bottles
                          : item.bags === 1
                          ? t.common.bag
                          : t.common.bags;
                        return `<tr>
                          <td><strong>${escapeHtml(fname)}</strong></td>
                          <td class="text-right">${item.kgAmount} ${escapeHtml(t.common.kg)}</td>
                          <td class="text-center">${item.bags} ${escapeHtml(unitWord)}</td>
                          <td class="text-right"><strong>${escapeHtml(currencySymbol)} ${item.estimatedCost.toLocaleString()}</strong></td>
                        </tr>`;
                      })
                      .join('')}
                    <tr style="font-weight: 700; background: #fafafa;">
                      <td colspan="2" style="font-size: 11.5pt;">
                        <span class="npk-pill-n">N: ${st.totalNpk.n}kg</span> • 
                        <span class="npk-pill-p">P: ${st.totalNpk.p}kg</span> • 
                        <span class="npk-pill-k">K: ${st.totalNpk.k}kg</span>
                      </td>
                      <td class="text-right" style="font-size: 12pt; color: #6b7280;">${escapeHtml(pickText(lang, 'Total', 'कुल', 'एकूण'))}:</td>
                      <td class="text-right" style="color: #15803d; font-size: 14pt;">${escapeHtml(currencySymbol)} ${st.totalCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="advisory-box">
                  <div class="advisory-title">
                    💡 ${escapeHtml(pickText(lang, 'Agronomic Advice & Application Method', 'कृषि वैज्ञानिक सलाह एवं प्रयोग विधि', 'तज्ज्ञ कृषी सल्ला व वापर पद्धत'))}
                  </div>
                  ${(() => {
                    const adviceParsed = parseAdvicePoints(tipText);
                    if (adviceParsed.isList) {
                      return `<div class="advisory-points-list">
                        ${adviceParsed.points
                          .map(
                            (pt, pIdx) => `<div class="advisory-point-item">
                              <span class="advisory-point-num">${getLocalizedPointNum(pIdx + 1, lang)}.</span>
                              <div class="advisory-point-text">${escapeHtml(pt)}</div>
                            </div>`
                          )
                          .join('')}
                      </div>`;
                    }
                    return `<div style="line-height: 1.5;">${escapeHtml(tipText)}</div>`;
                  })()}
                </div>
              </div>`;
            })
            .join('')}
        </div>`;
      })
      .join('')}
  </div>

  <!-- Disclaimer and Footer -->
  <div class="footer">
    <div style="flex: 1; padding-right: 20px;">
      ${escapeHtml(disclaimerText)}
    </div>
    <div style="text-align: right; white-space: nowrap;">
      <strong>KrishiPlan v1.0</strong><br />
      Consolidated Farm Report
    </div>
  </div>

</body>
</html>`;
}

export async function exportConsolidatedScheduleToPdf(
  summaries: FieldSummary[],
  lang: Language,
  currencySymbol: string,
  farmerName?: string
): Promise<boolean> {
  try {
    if (summaries.length === 0) return false;
    const html = buildConsolidatedPdfHtml(summaries, lang, currencySymbol, farmerName);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    }

    const printResult = await Print.printToFileAsync({
      html,
      base64: true,
    });

    const fileName = `consolidated-farm-fertilizer-schedule-${Date.now()}.pdf`;
    const targetFile = new File(Paths.cache, fileName);
    targetFile.create({ overwrite: true });

    if (printResult.base64) {
      await targetFile.write(printResult.base64, { encoding: 'base64' });
    } else {
      const srcFile = new File(printResult.uri);
      await srcFile.copy(targetFile, { overwrite: true });
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      try {
        await Sharing.shareAsync(targetFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Consolidated Farm Fertilizer Schedule (${summaries.length} Plots)`,
          UTI: 'com.adobe.pdf',
        });
        return true;
      } catch (shareErr) {
        console.warn('Sharing.shareAsync failed:', shareErr);
      }
    }

    // Fallback 1: File.preview
    try {
      const canPreview = await targetFile.canPreview();
      if (canPreview) {
        await targetFile.preview();
        return true;
      }
    } catch (previewErr) {
      console.warn('targetFile.preview failed:', previewErr);
    }

    // Fallback 2: Print.printAsync
    await Print.printAsync({ html });
    return true;
  } catch (err) {
    console.error('Failed to export consolidated PDF:', err);
    return false;
  }
}
