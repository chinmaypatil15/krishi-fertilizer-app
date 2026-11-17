import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NutrientTrackerCard } from '../components/NutrientTrackerCard';
import { formatStr, pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import {
  AppSettings,
  CalculatedStage,
  FieldSummary,
  NPKValues,
} from '../types';
import { formatReadableDate, roundTo } from '../utils/calculations';
import { exportConsolidatedScheduleToPdf } from '../utils/pdfExport';

interface Props {
  summaries: FieldSummary[];
  settings: AppSettings;
  farmerName?: string;
  onOpenAddField: () => void;
  onSelectField: (fieldId: string) => void;
  onToggleStageDone: (fieldId: string, stageId: string) => void;
  onLoadSampleData: () => void;
}

interface ActionTask {
  fieldId: string;
  fieldName: string;
  cropEmoji: string;
  cropName: string;
  stage: CalculatedStage;
}

export const DashboardScreen: React.FC<Props> = ({
  summaries,
  settings,
  farmerName,
  onOpenAddField,
  onSelectField,
  onToggleStageDone,
  onLoadSampleData,
}) => {
  const lang = settings.language;
  const t = TRANSLATIONS[lang];
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportConsolidatedPdf = async () => {
    if (summaries.length === 0) {
      Alert.alert(t.fields.title, t.fields.noPlotsToExport);
      return;
    }
    setExportingPdf(true);
    try {
      const success = await exportConsolidatedScheduleToPdf(
        summaries,
        lang,
        settings.currencySymbol,
        farmerName
      );
      if (success) {
        Alert.alert('✅ PDF Export', t.fields.consolidatedSuccess);
      }
    } catch (err) {
      console.error('Failed to export consolidated PDF:', err);
      Alert.alert('PDF Export', t.detail.pdfError);
    } finally {
      setExportingPdf(false);
    }
  };

  const stats = useMemo(() => {
    let actionCount = 0;
    let spentCost = 0;
    let plannedCost = 0;
    const appliedNpk: NPKValues = { n: 0, p: 0, k: 0 };
    const plannedNpk: NPKValues = { n: 0, p: 0, k: 0 };
    const tasks: ActionTask[] = [];

    for (const s of summaries) {
      actionCount += s.overdueCount + s.dueSoonCount;
      spentCost += s.spentCost;
      plannedCost += s.plannedCost;
      appliedNpk.n = roundTo(appliedNpk.n + s.appliedNpk.n, 1);
      appliedNpk.p = roundTo(appliedNpk.p + s.appliedNpk.p, 1);
      appliedNpk.k = roundTo(appliedNpk.k + s.appliedNpk.k, 1);
      plannedNpk.n = roundTo(plannedNpk.n + s.plannedNpk.n, 1);
      plannedNpk.p = roundTo(plannedNpk.p + s.plannedNpk.p, 1);
      plannedNpk.k = roundTo(plannedNpk.k + s.plannedNpk.k, 1);

      for (const st of s.stages) {
        if (
          !st.isCompleted &&
          (st.status === 'overdue' ||
            st.status === 'due_today' ||
            st.status === 'upcoming')
        ) {
          tasks.push({
            fieldId: s.field.id,
            fieldName: s.field.name,
            cropEmoji: s.crop.emoji,
            cropName: pickText(lang, s.crop.name, s.crop.hiName, s.crop.mrName),
            stage: st,
          });
        }
      }
    }

    tasks.sort((a, b) => a.stage.daysFromToday - b.stage.daysFromToday);
    return {
      actionCount,
      spentCost,
      plannedCost,
      appliedNpk,
      plannedNpk,
      tasks,
    };
  }, [summaries, lang]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{summaries.length}</Text>
          <Text style={styles.kpiLabel}>{t.home.activeFields}</Text>
        </View>
        <View
          style={[
            styles.kpiCard,
            stats.actionCount > 0 && { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
          ]}
        >
          <Text
            style={[
              styles.kpiValue,
              stats.actionCount > 0 && { color: Colors.warning },
            ]}
          >
            {stats.actionCount}
          </Text>
          <Text style={styles.kpiLabel}>{t.home.actionNeeded}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { fontSize: 17 }]} numberOfLines={1}>
            {settings.currencySymbol}
            {stats.spentCost.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>
            / {settings.currencySymbol}
            {stats.plannedCost.toLocaleString()}
          </Text>
        </View>
      </View>

      {summaries.length > 0 && (
        <TouchableOpacity
          style={styles.consolidatedPdfCard}
          onPress={handleExportConsolidatedPdf}
          disabled={exportingPdf}
          activeOpacity={0.85}
        >
          <View style={styles.pdfIconWrap}>
            {exportingPdf ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="document-text" size={22} color="#FFFFFF" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.consolidatedTitle}>
              {t.fields.downloadConsolidatedPdf}
            </Text>
            <Text style={styles.consolidatedSubtitle}>
              {t.fields.consolidatedPdfSubtitle}
            </Text>
          </View>
          <View style={styles.downloadIconWrap}>
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {summaries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌾</Text>
          <Text style={styles.emptyTitle}>{t.home.noFieldsTitle}</Text>
          <Text style={styles.emptyDesc}>{t.home.noFieldsDesc}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onOpenAddField}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{t.common.addField}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onLoadSampleData}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primaryDark} />
            <Text style={styles.secondaryBtnText}>{t.settings.loadDemo}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Upcoming & Overdue Doses */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.upcomingTasks}</Text>
            <TouchableOpacity style={styles.smallAddBtn} onPress={onOpenAddField}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.smallAddBtnText}>{t.common.addField}</Text>
            </TouchableOpacity>
          </View>

          {stats.tasks.length === 0 ? (
            <View style={styles.caughtUpCard}>
              <Ionicons name="checkmark-done-circle" size={32} color={Colors.success} />
              <Text style={styles.caughtUpTitle}>{t.home.allCaughtUp}</Text>
              <Text style={styles.caughtUpDesc}>{t.home.noUpcomingDesc}</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {stats.tasks.map((task) => {
                const { stage } = task;
                const isOverdue = stage.status === 'overdue';
                const isToday = stage.status === 'due_today';
                const relativeText =
                  stage.daysFromToday === 0
                    ? t.common.today
                    : stage.daysFromToday > 0
                    ? formatStr(t.common.inDays, { n: stage.daysFromToday })
                    : formatStr(t.common.daysAgo, { n: Math.abs(stage.daysFromToday) });

                return (
                  <TouchableOpacity
                    key={`${task.fieldId}-${stage.id}`}
                    style={[
                      styles.taskCard,
                      isOverdue && styles.taskCardOverdue,
                      isToday && styles.taskCardToday,
                    ]}
                    onPress={() => onSelectField(task.fieldId)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.taskTop}>
                      <View style={styles.taskPlotRow}>
                        <Text style={{ fontSize: 18 }}>{task.cropEmoji}</Text>
                        <Text style={styles.taskPlotName} numberOfLines={1}>
                          {task.fieldName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          isOverdue
                            ? { backgroundColor: Colors.dangerLight }
                            : { backgroundColor: Colors.warningLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: isOverdue ? Colors.danger : Colors.warning },
                          ]}
                        >
                          {t.status[stage.status]} • {relativeText}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.taskStage}>
                      {pickText(
                        lang,
                        stage.stageName,
                        stage.hiStageName,
                        stage.mrStageName
                      )}
                    </Text>
                    <Text style={styles.taskDate}>
                      {formatReadableDate(stage.scheduledDate, lang)} ({t.common.day}{' '}
                      {stage.daysAfterSowing})
                    </Text>

                    <View style={styles.dosePills}>
                      {stage.items.map((item) => (
                        <View key={item.fertilizerId} style={styles.dosePill}>
                          <Text style={styles.dosePillText}>
                            {pickText(lang, item.name, item.hiName, item.mrName)}:{' '}
                            <Text style={{ fontWeight: '800' }}>
                              {item.kgAmount} {t.common.kg}
                            </Text>{' '}
                            ({item.bags} {t.common.bags})
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.markDoneRowBtn}
                      onPress={() => onToggleStageDone(task.fieldId, stage.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.markDoneRowText}>{t.common.markDone}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* NPK Overview */}
          <View style={{ marginTop: 18 }}>
            <NutrientTrackerCard
              title={t.home.npkOverview}
              appliedNpk={stats.appliedNpk}
              plannedNpk={stats.plannedNpk}
              spentCost={stats.spentCost}
              plannedCost={stats.plannedCost}
              currencySymbol={settings.currencySymbol}
              language={lang}
            />
          </View>
        </>
      )}

      <Text style={styles.disclaimer}>{t.common.disclaimer}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiValue: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 10,
    width: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  smallAddBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  caughtUpCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  caughtUpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  caughtUpDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  taskCardOverdue: {
    borderColor: '#FCA5A5',
  },
  taskCardToday: {
    borderColor: '#FCD34D',
  },
  taskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  taskPlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  taskPlotName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskStage: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 6,
  },
  taskDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dosePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  dosePill: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  dosePillText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  markDoneRowBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  markDoneRowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 18,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  consolidatedPdfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pdfIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consolidatedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  consolidatedSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  downloadIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
