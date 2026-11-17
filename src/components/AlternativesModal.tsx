import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import {
  AlternativeOption,
  CalculatedStage,
  FertilizerId,
  Language,
} from '../types';
import { generateStageAlternatives } from '../utils/alternatives';

interface Props {
  visible: boolean;
  standardStage: CalculatedStage | null;
  isOverridden?: boolean;
  language: Language;
  currencySymbol: string;
  fertilizerPrices: Record<FertilizerId, number>;
  canApply?: boolean;
  onSelectOption?: (
    option: AlternativeOption,
    unavailableIds: FertilizerId[]
  ) => void;
  onResetStandard?: () => void;
  onClose: () => void;
}

export const AlternativesModal: React.FC<Props> = ({
  visible,
  standardStage,
  isOverridden = false,
  language,
  currencySymbol,
  fertilizerPrices,
  canApply = false,
  onSelectOption,
  onResetStandard,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const [unavailableIds, setUnavailableIds] = useState<FertilizerId[]>([]);

  useEffect(() => {
    if (visible && standardStage) {
      // Pre-select the first item by default so the farmer immediately sees alternatives!
      const firstId = standardStage.items[0]?.fertilizerId as
        | FertilizerId
        | undefined;
      setUnavailableIds(firstId ? [firstId] : []);
    }
  }, [visible, standardStage]);

  const options = useMemo(() => {
    if (!standardStage) return [];
    return generateStageAlternatives(
      standardStage,
      unavailableIds,
      fertilizerPrices
    );
  }, [standardStage, unavailableIds, fertilizerPrices]);

  if (!standardStage) return null;

  const toggleUnavailable = (id: FertilizerId) => {
    setUnavailableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const stageTitle = pickText(
    language,
    standardStage.stageName,
    standardStage.hiStageName,
    standardStage.mrStageName
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.alternatives.modalTitle}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {stageTitle}
            </Text>
          </View>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {isOverridden && canApply && onResetStandard && (
            <TouchableOpacity
              style={styles.resetBanner}
              onPress={() => {
                onResetStandard();
                onClose();
              }}
            >
              <Ionicons name="refresh" size={16} color={Colors.primaryDark} />
              <Text style={styles.resetBannerText}>
                {t.alternatives.resetStandard}
              </Text>
            </TouchableOpacity>
          )}

          {/* Unavailable Fertilizer Selector */}
          <Text style={styles.promptText}>{t.alternatives.modalSub}</Text>
          <View style={styles.chipsWrap}>
            {standardStage.items.map((item) => {
              const id = item.fertilizerId as FertilizerId;
              const selected = unavailableIds.includes(id);
              const label = pickText(language, item.name, item.hiName, item.mrName);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, selected && styles.chipUnavailable]}
                  onPress={() => toggleUnavailable(id)}
                >
                  <Ionicons
                    name={selected ? 'close-circle' : 'checkmark-circle'}
                    size={17}
                    color={selected ? Colors.danger : Colors.success}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextUnavailable,
                    ]}
                  >
                    {label} ({item.kgAmount} {t.common.kg})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Suggested Combinations */}
          {unavailableIds.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>
                {t.alternatives.selectPrompt}
              </Text>
            </View>
          ) : (
            <View style={styles.optionsList}>
              {options.map((opt, idx) => (
                <View key={opt.id} style={styles.optionCard}>
                  <View style={styles.optionHeader}>
                    <View style={styles.optionBadge}>
                      <Text style={styles.optionBadgeText}>
                        {pickText(
                          language,
                          `Option ${idx + 1}`,
                          `विकल्प ${idx + 1}`,
                          `पर्याय ${idx + 1}`
                        )}
                      </Text>
                    </View>
                    <Text style={styles.optionCost}>
                      ~{currencySymbol}
                      {opt.totalCost.toLocaleString()}
                    </Text>
                  </View>

                  <Text style={styles.optionTitle}>
                    {pickText(language, opt.title, opt.hiTitle, opt.mrTitle)}
                  </Text>
                  <Text style={styles.optionSub}>
                    {pickText(language, opt.subtitle, opt.hiSubtitle, opt.mrSubtitle)}
                  </Text>

                  <View style={styles.itemsBox}>
                    {opt.items.map((item) => {
                      const fname = pickText(language, item.name, item.hiName, item.mrName);
                      const unitWord = item.isBottle
                        ? item.bags === 1
                          ? t.alternatives.bottle
                          : t.alternatives.bottles
                        : item.bags === 1
                        ? t.common.bag
                        : t.common.bags;
                      return (
                        <View key={item.fertilizerId} style={styles.itemRow}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.itemName}>{fname}</Text>
                            <Text style={styles.itemBags}>
                              {item.bags} {unitWord}
                              {!item.isBottle
                                ? ` (${item.bagWeightKg} ${t.common.kg}/${t.common.bag})`
                                : ''}
                            </Text>
                          </View>
                          <Text style={styles.itemKg}>
                            {item.isBottle
                              ? `${item.bags} ${unitWord}`
                              : `${item.kgAmount} ${t.common.kg}`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.npkRow}>
                    <Text style={[styles.npkPill, { color: Colors.nitrogen }]}>
                      N: {opt.totalNpk.n}kg
                    </Text>
                    <Text style={[styles.npkPill, { color: Colors.phosphorus }]}>
                      P: {opt.totalNpk.p}kg
                    </Text>
                    <Text style={[styles.npkPill, { color: Colors.potassium }]}>
                      K: {opt.totalNpk.k}kg
                    </Text>
                  </View>

                  <View style={styles.noteBox}>
                    <Ionicons
                      name="bulb-outline"
                      size={15}
                      color={Colors.primaryDark}
                      style={{ marginTop: 1 }}
                    />
                    <Text style={styles.noteText}>
                      {pickText(language, opt.note, opt.hiNote, opt.mrNote)}
                    </Text>
                  </View>

                  {canApply && onSelectOption && (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => {
                        onSelectOption(opt, unavailableIds);
                        onClose();
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.applyBtnText}>
                        {t.alternatives.useCombination}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  resetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  resetBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipUnavailable: {
    backgroundColor: Colors.dangerLight,
    borderColor: '#FCA5A5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chipTextUnavailable: {
    color: Colors.danger,
    textDecorationLine: 'line-through',
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
  },
  optionCost: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  itemsBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    gap: 7,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemBags: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  itemKg: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  npkRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  npkPill: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F6FBF7',
    borderRadius: 10,
    padding: 9,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D8ECDF',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
