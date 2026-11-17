import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { Language, NPKValues } from '../types';

interface Props {
  title: string;
  appliedNpk: NPKValues;
  plannedNpk: NPKValues;
  spentCost: number;
  plannedCost: number;
  currencySymbol: string;
  language: Language;
  showApplied?: boolean;
}

export const NutrientTrackerCard: React.FC<Props> = ({
  title,
  appliedNpk,
  plannedNpk,
  spentCost,
  plannedCost,
  currencySymbol,
  language,
  showApplied = true,
}) => {
  const t = TRANSLATIONS[language];

  const rows = [
    {
      label: pickText(language, 'Nitrogen (N)', 'नाइट्रोजन (N)', 'नायट्रोजन (N)'),
      applied: appliedNpk.n,
      planned: plannedNpk.n,
      color: Colors.nitrogen,
    },
    {
      label: pickText(language, 'Phosphorus (P₂O₅)', 'फॉस्फोरस (P₂O₅)', 'फॉस्फरस (P₂O₅)'),
      applied: appliedNpk.p,
      planned: plannedNpk.p,
      color: Colors.phosphorus,
    },
    {
      label: pickText(language, 'Potassium (K₂O)', 'पोटाश (K₂O)', 'पोटॅश (K₂O)'),
      applied: appliedNpk.k,
      planned: plannedNpk.k,
      color: Colors.potassium,
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.barsContainer}>
        {rows.map((row) => {
          const pct =
            row.planned > 0
              ? Math.min(100, Math.round((row.applied / row.planned) * 100))
              : 0;
          return (
            <View key={row.label} style={styles.barRow}>
              <View style={styles.barHeader}>
                <Text style={styles.nutrientLabel}>{row.label}</Text>
                <Text style={styles.nutrientVal}>
                  {showApplied
                    ? `${row.applied} / ${row.planned} ${t.common.kg}`
                    : `${row.planned} ${t.common.kg}`}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: row.color,
                      width: `${showApplied ? pct : 100}%`,
                      opacity: showApplied ? 1 : 0.75,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.costFooter}>
        {showApplied ? (
          <>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>{t.detail.spentLabel}</Text>
              <Text style={styles.costValue}>
                {currencySymbol}
                {spentCost.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>{t.detail.totalEstLabel}</Text>
              <Text style={styles.costValueSecondary}>
                {currencySymbol}
                {plannedCost.toLocaleString()}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.costBox}>
            <Text style={styles.costLabel}>{t.detail.totalEstLabel}</Text>
            <Text style={styles.costValue}>
              {currencySymbol}
              {plannedCost.toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  barsContainer: {
    gap: 10,
  },
  barRow: {
    gap: 5,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nutrientVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
  costFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  costBox: {
    flex: 1,
  },
  costDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  costLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  costValueSecondary: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
