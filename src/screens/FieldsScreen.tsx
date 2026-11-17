import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatStr, pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { AppSettings, FieldSummary } from '../types';
import { formatReadableDate } from '../utils/calculations';
import { exportConsolidatedScheduleToPdf } from '../utils/pdfExport';

interface Props {
  summaries: FieldSummary[];
  settings: AppSettings;
  farmerName?: string;
  onOpenAddField: () => void;
  onSelectField: (fieldId: string) => void;
}

export const FieldsScreen: React.FC<Props> = ({
  summaries,
  settings,
  farmerName,
  onOpenAddField,
  onSelectField,
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.title}>{t.fields.title}</Text>
            <Text style={styles.subtitle}>
              {formatStr(t.fields.subtitle, { n: summaries.length })}
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenAddField}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>{t.common.addField}</Text>
          </TouchableOpacity>
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
            <Text style={styles.emptyEmoji}>🚜</Text>
            <Text style={styles.emptyTitle}>{t.fields.emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{t.fields.emptyDesc}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {summaries.map((s) => {
              const cropName = pickText(lang, s.crop.name, s.crop.hiName, s.crop.mrName);
              const pct =
                s.stages.length > 0
                  ? Math.round((s.completedCount / s.stages.length) * 100)
                  : 0;
              const dayStatus =
                s.daysSinceSowing >= 0
                  ? formatStr(t.fields.daysSinceSowing, { n: s.daysSinceSowing })
                  : formatStr(t.fields.notSownYet, { n: Math.abs(s.daysSinceSowing) });

              return (
                <TouchableOpacity
                  key={s.field.id}
                  style={styles.card}
                  onPress={() => onSelectField(s.field.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.emojiCircle}>
                      <Text style={{ fontSize: 24 }}>{s.crop.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldName}>{s.field.name}</Text>
                      <Text style={styles.fieldMeta}>
                        {cropName} • {s.field.areaValue} {t.units[s.field.areaUnit]} •{' '}
                        {formatReadableDate(s.field.sowingDate, lang)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.statusStrip}>
                    <Text style={styles.dayPill}>{dayStatus}</Text>
                    <Text style={styles.progressText}>
                      {formatStr(t.fields.progress, {
                        done: s.completedCount,
                        total: s.stages.length,
                      })}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>

                  <View style={styles.footerRow}>
                    {s.nextStage ? (
                      <View style={styles.nextRow}>
                        <Ionicons
                          name={
                            s.nextStage.status === 'overdue'
                              ? 'alert-circle'
                              : 'calendar-outline'
                          }
                          size={15}
                          color={
                            s.nextStage.status === 'overdue'
                              ? Colors.danger
                              : Colors.primaryDark
                          }
                        />
                        <Text
                          style={[
                            styles.nextText,
                            s.nextStage.status === 'overdue' && {
                              color: Colors.danger,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {t.fields.nextDose}:{' '}
                          {pickText(
                            lang,
                            s.nextStage.stageName,
                            s.nextStage.hiStageName,
                            s.nextStage.mrStageName
                          )}{' '}
                          ({formatReadableDate(s.nextStage.scheduledDate, lang)})
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.nextRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color={Colors.success}
                        />
                        <Text style={[styles.nextText, { color: Colors.success }]}>
                          {t.fields.allDone}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.costText}>
                      {settings.currencySymbol}
                      {s.plannedCost.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fieldMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  dayPill: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 99,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  nextText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
  },
  costText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  consolidatedPdfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
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
