import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlternativesModal } from '../components/AlternativesModal';
import { DatePickerModal } from '../components/DatePickerModal';
import { NutrientTrackerCard } from '../components/NutrientTrackerCard';
import { TimelineItem } from '../components/TimelineItem';
import { CROPS, CROP_LIST } from '../data/crops';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import {
  AlternativeOption,
  AppSettings,
  AreaUnit,
  CropId,
  FarmerField,
  FertilizerId,
  NPKValues,
  StageAlternativeOverride,
} from '../types';
import {
  aggregateStageFertilizers,
  buildFieldSummary,
  calculateStages,
  formatReadableDate,
  getTodayISO,
  roundTo,
} from '../utils/calculations';
import { exportFieldScheduleToPdf } from '../utils/pdfExport';

interface Props {
  settings: AppSettings;
  onSaveAsField: (preset: {
    cropId: CropId;
    sowingDate: string;
    areaValue: number;
    areaUnit: AreaUnit;
  }) => void;
}

const UNITS: AreaUnit[] = ['acre', 'hectare', 'bigha'];

export const CalculatorScreen: React.FC<Props> = ({
  settings,
  onSaveAsField,
}) => {
  const lang = settings.language;
  const t = TRANSLATIONS[lang];

  const [cropId, setCropId] = useState<CropId>('chickpea');
  const [bananaPlan, setBananaPlan] = useState<'standard' | 'special'>('standard');
  const [sowingDate, setSowingDate] = useState(getTodayISO());
  const [areaText, setAreaText] = useState('1');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('acre');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [altStageId, setAltStageId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewOverrides, setPreviewOverrides] = useState<
    Record<string, StageAlternativeOverride>
  >({});

  const areaValue = useMemo(() => {
    const n = parseFloat(areaText.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [areaText]);

  const standardStages = useMemo(
    () =>
      calculateStages({
        cropId,
        sowingDate,
        areaValue,
        areaUnit,
        fertilizerPrices: settings.fertilizerPrices,
      }),
    [cropId, sowingDate, areaValue, areaUnit, settings.fertilizerPrices]
  );

  const stages = useMemo(
    () =>
      calculateStages({
        cropId,
        sowingDate,
        areaValue,
        areaUnit,
        stageOverrides: previewOverrides,
        fertilizerPrices: settings.fertilizerPrices,
      }),
    [cropId, sowingDate, areaValue, areaUnit, previewOverrides, settings.fertilizerPrices]
  );

  const standardStageForModal = useMemo(
    () => standardStages.find((s) => s.id === altStageId) ?? null,
    [standardStages, altStageId]
  );

  const totals = useMemo(() => {
    const items = aggregateStageFertilizers(stages);
    const totalCost = stages.reduce((acc, s) => acc + s.totalCost, 0);
    const totalNpk = stages.reduce<NPKValues>(
      (acc, s) => ({
        n: roundTo(acc.n + s.totalNpk.n, 1),
        p: roundTo(acc.p + s.totalNpk.p, 1),
        k: roundTo(acc.k + s.totalNpk.k, 1),
      }),
      { n: 0, p: 0, k: 0 }
    );
    return { items, totalCost, totalNpk };
  }, [stages]);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const selectedCrop = CROPS[cropId];
      const cropLabel = pickText(
        lang,
        selectedCrop?.name ?? cropId,
        selectedCrop?.hiName ?? cropId,
        selectedCrop?.mrName ?? cropId
      );
      const tempField: FarmerField = {
        id: `calc-${Date.now()}`,
        name: `${cropLabel} (${areaValue} ${t.units[areaUnit]})`,
        cropId,
        sowingDate,
        areaValue,
        areaUnit,
        completedStageIds: [],
        completedDates: {},
        stageOverrides: previewOverrides,
        remindersEnabled: false,
        createdAt: new Date().toISOString(),
      };
      const summary = buildFieldSummary(tempField, settings);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t.calculator.title}</Text>
      <Text style={styles.subtitle}>{t.calculator.subtitle}</Text>

      {/* Crop Horizontal Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cropStrip}
      >
        {CROP_LIST.map((crop) => {
          const isBanana = crop.id === 'banana';
          const active =
            crop.id === cropId ||
            (isBanana && (cropId === 'banana' || cropId === 'banana_special'));
          return (
            <TouchableOpacity
              key={crop.id}
              style={[styles.cropPill, active && styles.cropPillActive]}
              onPress={() => {
                if (isBanana) {
                  setCropId(bananaPlan === 'special' ? 'banana_special' : 'banana');
                } else {
                  setCropId(crop.id);
                }
              }}
            >
              <Text style={{ fontSize: 17 }}>{crop.emoji}</Text>
              <Text
                style={[
                  styles.cropPillText,
                  active && styles.cropPillTextActive,
                ]}
              >
                {pickText(lang, crop.name, crop.hiName, crop.mrName)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Banana Plan Sub-selection */}
      {(cropId === 'banana' || cropId === 'banana_special') && (
        <View style={styles.bananaPlanCard}>
          <View style={styles.bananaPlanHeader}>
            <Ionicons name="options" size={16} color={Colors.primaryDark} />
            <Text style={styles.bananaPlanTitle}>
              {pickText(
                lang,
                'Choose Banana Plan',
                'केले की योजना चुनें',
                'केळी खत नियोजन निवडा'
              )}
            </Text>
          </View>

          <View style={styles.bananaToggleRow}>
            <TouchableOpacity
              style={[
                styles.bananaToggleBtn,
                bananaPlan === 'standard' && styles.bananaToggleBtnActive,
              ]}
              onPress={() => {
                setBananaPlan('standard');
                setCropId('banana');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  bananaPlan === 'standard'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={16}
                color={
                  bananaPlan === 'standard'
                    ? Colors.primaryDark
                    : Colors.textMuted
                }
              />
              <Text
                style={[
                  styles.bananaToggleText,
                  bananaPlan === 'standard' && styles.bananaToggleTextActive,
                ]}
              >
                {pickText(
                  lang,
                  '🌿 Standard (5 Doses)',
                  '🌿 सामान्य (5 खुराक)',
                  '🌿 सर्वसाधारण (५ हप्ते)'
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bananaToggleBtn,
                bananaPlan === 'special' && styles.bananaToggleBtnActive,
              ]}
              onPress={() => {
                setBananaPlan('special');
                setCropId('banana_special');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  bananaPlan === 'special'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={16}
                color={
                  bananaPlan === 'special'
                    ? Colors.primaryDark
                    : Colors.textMuted
                }
              />
              <Text
                style={[
                  styles.bananaToggleText,
                  bananaPlan === 'special' && styles.bananaToggleTextActive,
                ]}
              >
                {pickText(
                  lang,
                  '⭐ Special Jalgaon (9 Doses)',
                  '⭐ विशेष जलगाँव (9 खुराक)',
                  '⭐ विशेष जळगाव (९ हप्ते)'
                )}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bananaPlanNote}>
            {bananaPlan === 'standard'
              ? pickText(
                  lang,
                  'University recommendation • Straight NPK basal & top dressings',
                  'विश्वविद्यालय मानक • बेसल डीएपी व टॉप ड्रेसिंग',
                  'कृषी विद्यापीठ प्रमाणक • बेसल डीएपी व जमिनीतील हप्ते'
                )
              : pickText(
                  lang,
                  'Per 1,000 plants standard (1 Acre = 1,500 plants, 1 Bigha = 1,100-1,200 plants) • Sucker treatment, drenching, spindle filling & drip fertigation',
                  '1000 पौधों के आधार पर (1 एकड़ = 1500 पौधे, 1 बीघा = 1100-1200) • बेणे प्रक्रिया, ड्रेंचिंग, पोगेभरण व ड्रिप',
                  'दर १००० झाडांसाठी (१ एकर = १५०० झाडे, १ विघा = ११००-१२०० झाडे) • बेणे प्रक्रिया, ड्रेंचिंग, पोगेभरणे व ड्रिप'
                )}
          </Text>
        </View>
      )}

      {/* Inputs Card */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>{t.common.sowingDate}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setDateModalOpen(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar" size={18} color={Colors.primary} />
            <Text style={styles.dateVal}>
              {formatReadableDate(sowingDate, lang)}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t.common.area}</Text>
        <View style={styles.areaRow}>
          <TextInput
            style={styles.areaInput}
            value={areaText}
            onChangeText={setAreaText}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.unitGroup}>
            {UNITS.map((u) => {
              const active = u === areaUnit;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, active && styles.unitBtnActive]}
                  onPress={() => setAreaUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      active && styles.unitBtnTextActive,
                    ]}
                  >
                    {t.units[u]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* CTAs: Save As Field & Download PDF */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.saveCta}
          onPress={() =>
            onSaveAsField({ cropId, sowingDate, areaValue, areaUnit })
          }
        >
          <Ionicons name="bookmark" size={17} color="#FFFFFF" />
          <Text style={styles.saveCtaText}>{t.calculator.saveAsField}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pdfCta}
          onPress={handleExportPdf}
          disabled={exportingPdf}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text" size={17} color="#FFFFFF" />
          <Text style={styles.pdfCtaText}>
            {exportingPdf ? `${t.common.downloadPdf}...` : t.common.downloadPdf}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Total Season Fertilizers */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>
          {t.calculator.totalFertilizerSummary}
        </Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {totals.items.map((item) => (
            <View key={item.fertilizerId} style={styles.sumRow}>
              <Text style={styles.sumName}>
                {pickText(lang, item.name, item.hiName, item.mrName)}
              </Text>
              <Text style={styles.sumVal}>
                {item.totalKg} {t.common.kg} ({item.totalBags} {t.common.bags})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Planned NPK & Cost */}
      <View style={{ marginBottom: 18 }}>
        <NutrientTrackerCard
          title={t.detail.npkTrackerTitle}
          appliedNpk={totals.totalNpk}
          plannedNpk={totals.totalNpk}
          spentCost={totals.totalCost}
          plannedCost={totals.totalCost}
          currencySymbol={settings.currencySymbol}
          language={lang}
          showApplied={false}
        />
      </View>

      {/* Stage Timeline Preview */}
      <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
        {t.detail.timelineTitle}
      </Text>
      {stages.map((st, idx) => (
        <TimelineItem
          key={st.id}
          stage={st}
          language={lang}
          currencySymbol={settings.currencySymbol}
          isLast={idx === stages.length - 1}
          onOpenAlternatives={(id) => setAltStageId(id)}
        />
      ))}

      <DatePickerModal
        visible={dateModalOpen}
        value={sowingDate}
        language={lang}
        onSelect={setSowingDate}
        onClose={() => setDateModalOpen(false)}
      />

      <AlternativesModal
        visible={!!altStageId}
        standardStage={standardStageForModal}
        isOverridden={!!(altStageId && previewOverrides[altStageId])}
        language={lang}
        currencySymbol={settings.currencySymbol}
        fertilizerPrices={settings.fertilizerPrices}
        canApply
        onSelectOption={(option: AlternativeOption, unavailableIds: FertilizerId[]) => {
          if (!altStageId) return;
          setPreviewOverrides((prev) => ({
            ...prev,
            [altStageId]: {
              optionTitle: option.title,
              hiOptionTitle: option.hiTitle,
              unavailableIds,
              items: option.items,
              totalCost: option.totalCost,
              totalNpk: option.totalNpk,
              note: option.note,
              hiNote: option.hiNote,
            },
          }));
        }}
        onResetStandard={() => {
          if (!altStageId) return;
          setPreviewOverrides((prev) => {
            const copy = { ...prev };
            delete copy[altStageId];
            return copy;
          });
        }}
        onClose={() => setAltStageId(null)}
      />
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  cropStrip: {
    gap: 8,
    paddingBottom: 14,
  },
  cropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cropPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  cropPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cropPillTextActive: {
    color: Colors.primaryDark,
  },
  bananaPlanCard: {
    backgroundColor: '#F7FAF7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    marginBottom: 14,
  },
  bananaPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bananaPlanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  bananaToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bananaToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  bananaToggleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '50',
  },
  bananaToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bananaToggleTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  bananaPlanNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  dateButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  areaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  areaInput: {
    width: 82,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  unitGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitBtnActive: {
    backgroundColor: Colors.primary,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  saveCta: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  saveCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pdfCta: {
    flex: 1,
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pdfCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sumName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
