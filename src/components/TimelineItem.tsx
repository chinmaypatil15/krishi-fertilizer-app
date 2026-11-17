import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatStr, pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { CalculatedStage, Language } from '../types';
import { getLocalizedPointNum, parseAdvicePoints } from '../utils/adviceFormatter';
import { formatReadableDate } from '../utils/calculations';

interface Props {
  stage: CalculatedStage;
  language: Language;
  currencySymbol: string;
  isLast?: boolean;
  onToggleComplete?: (stageId: string) => void;
  onOpenAlternatives?: (stageId: string) => void;
}

export const TimelineItem: React.FC<Props> = ({
  stage,
  language,
  currencySymbol,
  isLast = false,
  onToggleComplete,
  onOpenAlternatives,
}) => {
  const t = TRANSLATIONS[language];

  const statusMeta = (() => {
    switch (stage.status) {
      case 'completed':
        return {
          bg: Colors.successLight,
          fg: Colors.success,
          dot: Colors.success,
          icon: 'checkmark' as const,
        };
      case 'overdue':
        return {
          bg: Colors.dangerLight,
          fg: Colors.danger,
          dot: Colors.danger,
          icon: 'alert' as const,
        };
      case 'due_today':
      case 'upcoming':
        return {
          bg: Colors.warningLight,
          fg: Colors.warning,
          dot: Colors.accent,
          icon: 'time' as const,
        };
      default:
        return {
          bg: Colors.surfaceAlt,
          fg: Colors.textSecondary,
          dot: Colors.textMuted,
          icon: 'calendar-outline' as const,
        };
    }
  })();

  const relativeLabel = (() => {
    if (stage.daysFromToday === 0) return t.common.today;
    if (stage.daysFromToday === 1) return t.common.tomorrow;
    if (stage.daysFromToday === -1) return t.common.yesterday;
    if (stage.daysFromToday > 1) {
      return formatStr(t.common.inDays, { n: stage.daysFromToday });
    }
    return formatStr(t.common.daysAgo, { n: Math.abs(stage.daysFromToday) });
  })();

  const stageTitle = pickText(language, stage.stageName, stage.hiStageName, stage.mrStageName);
  const growthPhase = pickText(language, stage.growthPhase, stage.hiGrowthPhase, stage.mrGrowthPhase);
  const tipText = pickText(language, stage.tip, stage.hiTip, stage.mrTip);
  const effectiveTip = stage.activeAlternativeNote
    ? pickText(
        language,
        stage.activeAlternativeNote,
        stage.hiActiveAlternativeNote ?? stage.activeAlternativeNote,
        stage.mrActiveAlternativeNote
      )
    : tipText;
  const adviceParsed = parseAdvicePoints(effectiveTip);

  return (
    <View style={styles.row}>
      {/* Timeline rail */}
      <View style={styles.rail}>
        <View style={[styles.node, { backgroundColor: statusMeta.dot }]}>
          <Ionicons name={statusMeta.icon} size={14} color="#FFFFFF" />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Card */}
      <View
        style={[
          styles.card,
          stage.status === 'overdue' && styles.cardOverdue,
          stage.status === 'due_today' && styles.cardDueToday,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dayBadgeText}>
              {t.common.day} {stage.daysAfterSowing}
            </Text>
            <Text style={styles.dateText}>
              {formatReadableDate(stage.scheduledDate, language)}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.fg }]}>
              {t.status[stage.status]} • {relativeLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.stageTitle}>{stageTitle}</Text>
        <Text style={styles.phaseText}>{growthPhase}</Text>

        {stage.activeAlternativeTitle && (
          <View style={styles.altBadge}>
            <Ionicons name="swap-horizontal" size={14} color={Colors.warning} />
            <Text style={styles.altBadgeText}>
              {t.alternatives.activeBadge}:{' '}
              {pickText(
                language,
                stage.activeAlternativeTitle,
                stage.hiActiveAlternativeTitle ?? stage.activeAlternativeTitle,
                stage.mrActiveAlternativeTitle
              )}
            </Text>
          </View>
        )}

        {/* Fertilizer Items */}
        <View style={styles.itemsBox}>
          {stage.items.map((item) => {
            const fname = pickText(language, item.name, item.hiName, item.mrName);
            const unitLabel = item.isBottle
              ? item.bags === 1
                ? t.alternatives.bottle
                : t.alternatives.bottles
              : item.bags === 1
              ? t.common.bag
              : t.common.bags;
            return (
              <View key={item.fertilizerId} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{fname}</Text>
                  <Text style={styles.itemBags}>
                    {item.bags} {unitLabel}
                    {!item.isBottle
                      ? ` (${item.bagWeightKg} ${t.common.kg}/${t.common.bag})`
                      : ''}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemKg}>
                    {item.isBottle
                      ? `${item.bags} ${unitLabel}`
                      : `${item.kgAmount} ${t.common.kg}`}
                  </Text>
                  <Text style={styles.itemCost}>
                    {currencySymbol}
                    {item.estimatedCost.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* NPK + Total Row */}
        <View style={styles.metaRow}>
          <View style={styles.npkRow}>
            <Text style={[styles.npkPill, { color: Colors.nitrogen }]}>
              N: {stage.totalNpk.n}kg
            </Text>
            <Text style={[styles.npkPill, { color: Colors.phosphorus }]}>
              P: {stage.totalNpk.p}kg
            </Text>
            <Text style={[styles.npkPill, { color: Colors.potassium }]}>
              K: {stage.totalNpk.k}kg
            </Text>
          </View>
          <Text style={styles.stageTotalCost}>
            {currencySymbol}
            {stage.totalCost.toLocaleString()}
          </Text>
        </View>

        {/* Tip */}
        <View style={styles.tipBox}>
          <Ionicons
            name="bulb-outline"
            size={16}
            color={Colors.primaryDark}
            style={{ marginTop: 2 }}
          />
          {adviceParsed.isList ? (
            <View style={styles.pointsList}>
              {adviceParsed.points.map((pt, idx) => (
                <View key={idx} style={styles.pointRow}>
                  <Text style={styles.pointNum}>
                    {getLocalizedPointNum(idx + 1, language)}.
                  </Text>
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.tipText}>{effectiveTip}</Text>
          )}
        </View>

        {/* Alternative Combination Trigger */}
        {onOpenAlternatives && !stage.isCompleted && (
          <TouchableOpacity
            style={styles.altBtn}
            onPress={() => onOpenAlternatives(stage.id)}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-horizontal" size={16} color={Colors.warning} />
            <Text style={styles.altBtnText}>{t.alternatives.buttonLabel}</Text>
          </TouchableOpacity>
        )}

        {/* Action Button */}
        {onToggleComplete && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              stage.isCompleted ? styles.actionBtnDone : styles.actionBtnPending,
            ]}
            onPress={() => onToggleComplete(stage.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={stage.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={stage.isCompleted ? Colors.success : '#FFFFFF'}
            />
            <Text
              style={[
                styles.actionBtnText,
                stage.isCompleted
                  ? styles.actionBtnTextDone
                  : styles.actionBtnTextPending,
              ]}
            >
              {stage.isCompleted
                ? `${t.common.completedOn} ${
                    stage.completedOn
                      ? formatReadableDate(stage.completedOn, language)
                      : ''
                  } (${t.common.undo})`
                : t.common.markDone}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  card: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardOverdue: {
    borderColor: '#FCA5A5',
  },
  cardDueToday: {
    borderColor: '#FCD34D',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  phaseText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  itemsBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemBags: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemKg: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  itemCost: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  npkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  npkPill: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageTotalCost: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F6FBF7',
    borderRadius: 10,
    padding: 9,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D8ECDF',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  pointsList: {
    flex: 1,
    gap: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  pointNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    minWidth: 18,
    lineHeight: 18,
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnPending: {
    backgroundColor: Colors.primary,
  },
  actionBtnDone: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnTextPending: {
    color: '#FFFFFF',
  },
  actionBtnTextDone: {
    color: Colors.success,
  },
  altBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 8,
  },
  altBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
    flex: 1,
  },
  altBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  altBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
});
