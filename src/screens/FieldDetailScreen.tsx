import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlternativesModal } from '../components/AlternativesModal';
import { NutrientTrackerCard } from '../components/NutrientTrackerCard';
import { TimelineItem } from '../components/TimelineItem';
import { formatStr, pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import {
  AlternativeOption,
  AppSettings,
  FertilizerId,
  FieldSummary,
} from '../types';
import {
  aggregateStageFertilizers,
  calculateStages,
  formatReadableDate,
} from '../utils/calculations';
import { exportFieldScheduleToIcs } from '../utils/icsExport';
import { exportFieldScheduleToPdf } from '../utils/pdfExport';

interface Props {
  summary: FieldSummary;
  settings: AppSettings;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStageDone: (stageId: string) => void;
  onToggleReminders: () => void;
  onApplyStageAlternative: (
    stageId: string,
    option: AlternativeOption,
    unavailableIds: FertilizerId[]
  ) => void;
  onResetStageAlternative: (stageId: string) => void;
}

export const FieldDetailScreen: React.FC<Props> = ({
  summary,
  settings,
  onBack,
  onEdit,
  onDelete,
  onToggleStageDone,
  onToggleReminders,
  onApplyStageAlternative,
  onResetStageAlternative,
}) => {
  const lang = settings.language;
  const t = TRANSLATIONS[lang];
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [altStageId, setAltStageId] = useState<string | null>(null);

  const { field, crop, stages } = summary;
  const cropName = pickText(lang, crop.name, crop.hiName, crop.mrName);
  const seasonLabel = pickText(lang, crop.season, crop.hiSeason, crop.mrSeason);

  const totalRequirements = useMemo(
    () => aggregateStageFertilizers(stages),
    [stages]
  );

  const standardStageForModal = useMemo(() => {
    if (!altStageId) return null;
    const baseStages = calculateStages({
      cropId: field.cropId,
      sowingDate: field.sowingDate,
      areaValue: field.areaValue,
      areaUnit: field.areaUnit,
      fertilizerPrices: settings.fertilizerPrices,
    });
    return baseStages.find((s) => s.id === altStageId) ?? null;
  }, [altStageId, field.cropId, field.sowingDate, field.areaValue, field.areaUnit, settings.fertilizerPrices]);

  const handleExportIcs = async () => {
    try {
      setExporting(true);
      const ok = await exportFieldScheduleToIcs(
        summary,
        lang,
        settings.currencySymbol
      );
      if (ok) {
        if (Platform.OS === 'web') {
          window.alert(t.detail.exportSuccess);
        } else {
          Alert.alert(t.common.done, t.detail.exportSuccess);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(t.detail.exportError);
        } else {
          Alert.alert('Info', t.detail.exportError);
        }
      }
    } catch {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', t.detail.exportError);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const ok = await exportFieldScheduleToPdf(
        summary,
        lang,
        settings.currencySymbol
      );
      if (ok) {
        if (Platform.OS !== 'web') {
          Alert.alert(t.common.done, t.detail.pdfSuccess);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(t.detail.pdfError);
        } else {
          Alert.alert('Info', t.detail.pdfError);
        }
      }
    } catch {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', t.detail.pdfError);
      }
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDeletePress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${t.detail.deleteConfirmTitle}\n${t.detail.deleteConfirmMsg}`)) {
        onDelete();
      }
      return;
    }
    Alert.alert(t.detail.deleteConfirmTitle, t.detail.deleteConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: onDelete },
    ]);
  };

  const dayStatus =
    summary.daysSinceSowing >= 0
      ? formatStr(t.fields.daysSinceSowing, { n: summary.daysSinceSowing })
      : formatStr(t.fields.notSownYet, { n: Math.abs(summary.daysSinceSowing) });

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {crop.emoji} {field.name}
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {cropName} • {seasonLabel}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Plot Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.common.sowingDate}</Text>
              <Text style={styles.infoVal}>
                {formatReadableDate(field.sowingDate, lang)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.common.area}</Text>
              <Text style={styles.infoVal}>
                {field.areaValue} {t.units[field.areaUnit]}
                {field.areaUnit !== 'acre' ? ` (${summary.areaInAcres} ac)` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={handleExportPdf}
              disabled={exportingPdf}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text" size={17} color="#FFFFFF" />
              <Text style={styles.pdfBtnText}>
                {exportingPdf ? `${t.common.downloadPdf}...` : t.common.downloadPdf}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoActions}>
              <TouchableOpacity
                style={styles.icsBtn}
                onPress={handleExportIcs}
                disabled={exporting}
              >
                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                <Text style={styles.icsBtnText}>{t.common.exportCalendar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.remBtn,
                  field.remindersEnabled ? styles.remBtnOn : styles.remBtnOff,
                ]}
                onPress={onToggleReminders}
              >
                <Ionicons
                  name={field.remindersEnabled ? 'notifications' : 'notifications-off-outline'}
                  size={16}
                  color={field.remindersEnabled ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.remBtnText,
                    !field.remindersEnabled && { color: Colors.textMuted },
                  ]}
                >
                  {field.remindersEnabled ? t.detail.remindersOn : t.detail.remindersOff}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* NPK & Cost Tracker */}
        <View style={{ marginBottom: 16 }}>
          <NutrientTrackerCard
            title={t.detail.npkTrackerTitle}
            appliedNpk={summary.appliedNpk}
            plannedNpk={summary.plannedNpk}
            spentCost={summary.spentCost}
            plannedCost={summary.plannedCost}
            currencySymbol={settings.currencySymbol}
            language={lang}
          />
        </View>

        {/* Total Bags Needed Summary */}
        <View style={styles.totalCard}>
          <Text style={styles.sectionTitle}>
            {t.calculator.totalFertilizerSummary}
          </Text>
          <View style={styles.totalList}>
            {totalRequirements.map((item) => (
              <View key={item.fertilizerId} style={styles.totalRow}>
                <Text style={styles.totalName}>
                  {pickText(lang, item.name, item.hiName, item.mrName)}
                </Text>
                <Text style={styles.totalRight}>
                  {item.totalKg} {t.common.kg} ({item.totalBags} {t.common.bags})
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Visual Timeline */}
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>{t.detail.timelineTitle}</Text>
          <Text style={styles.dayBadge}>{dayStatus}</Text>
        </View>

        {/* Sowing Day Anchor */}
        <View style={styles.sowingNodeRow}>
          <View style={styles.rail}>
            <View style={styles.sowingNode}>
              <Text style={{ fontSize: 12 }}>🌱</Text>
            </View>
            <View style={styles.railLine} />
          </View>
          <View style={styles.sowingCard}>
            <Text style={styles.sowingTitle}>{t.detail.sowingDayTitle}</Text>
            <Text style={styles.sowingDateText}>
              {formatReadableDate(field.sowingDate, lang)}
            </Text>
          </View>
        </View>

        {stages.map((st, idx) => (
          <TimelineItem
            key={st.id}
            stage={st}
            language={lang}
            currencySymbol={settings.currencySymbol}
            isLast={idx === stages.length - 1}
            onToggleComplete={onToggleStageDone}
            onOpenAlternatives={(id) => setAltStageId(id)}
          />
        ))}

        <Text style={styles.disclaimer}>{t.common.disclaimer}</Text>

        {/* Delete Plot Button at End of Page */}
        <TouchableOpacity
          style={styles.deletePlotBtn}
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deletePlotBtnText}>
            {pickText(
              lang,
              'Delete Sowing Plot',
              'यह फसल प्लॉट हटाएँ',
              'हा शेत प्लॉट काढून टाका'
            )}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AlternativesModal
        visible={!!altStageId}
        standardStage={standardStageForModal}
        isOverridden={!!(altStageId && field.stageOverrides?.[altStageId])}
        language={lang}
        currencySymbol={settings.currencySymbol}
        fertilizerPrices={settings.fertilizerPrices}
        canApply
        onSelectOption={(option, unavailableIds) => {
          if (altStageId) {
            onApplyStageAlternative(altStageId, option, unavailableIds);
          }
        }}
        onResetStandard={() => {
          if (altStageId) {
            onResetStageAlternative(altStageId);
          }
        }}
        onClose={() => setAltStageId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  topSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  infoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonsCol: {
    marginTop: 12,
    gap: 8,
  },
  pdfBtn: {
    backgroundColor: '#15803D',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  icsBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  icsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  remBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  remBtnOn: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#86EFAC',
  },
  remBtnOff: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  remBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  totalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalList: {
    marginTop: 10,
    gap: 7,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  totalName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  totalRight: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  sowingNodeRow: {
    flexDirection: 'row',
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  sowingNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  sowingCard: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sowingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  sowingDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  deletePlotBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  deletePlotBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
