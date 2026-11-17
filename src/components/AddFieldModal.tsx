import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CROP_LIST, CROPS } from '../data/crops';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { AreaUnit, CropId, FarmerField, Language } from '../types';
import { addDaysISO, formatReadableDate, getTodayISO } from '../utils/calculations';
import { DatePickerModal } from './DatePickerModal';

interface Props {
  visible: boolean;
  language: Language;
  initialField?: FarmerField | null;
  presetParams?: {
    cropId: CropId;
    sowingDate: string;
    areaValue: number;
    areaUnit: AreaUnit;
  } | null;
  onSave: (data: {
    id?: string;
    name: string;
    cropId: CropId;
    sowingDate: string;
    areaValue: number;
    areaUnit: AreaUnit;
    remindersEnabled: boolean;
  }) => void;
  onClose: () => void;
}

const AREA_UNITS: AreaUnit[] = ['acre', 'hectare', 'bigha'];

export const AddFieldModal: React.FC<Props> = ({
  visible,
  language,
  initialField,
  presetParams,
  onSave,
  onClose,
}) => {
  const t = TRANSLATIONS[language];

  const [name, setName] = useState('');
  const [cropId, setCropId] = useState<CropId>('wheat');
  const [bananaPlan, setBananaPlan] = useState<'standard' | 'special'>('standard');
  const [sowingDate, setSowingDate] = useState(getTodayISO());
  const [areaText, setAreaText] = useState('1');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('acre');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [dateModalOpen, setDateModalOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialField) {
      setName(initialField.name);
      if (initialField.cropId === 'banana_special') {
        setCropId('banana');
        setBananaPlan('special');
      } else {
        setCropId(initialField.cropId);
        setBananaPlan('standard');
      }
      setSowingDate(initialField.sowingDate);
      setAreaText(String(initialField.areaValue));
      setAreaUnit(initialField.areaUnit);
      setRemindersEnabled(initialField.remindersEnabled);
    } else if (presetParams) {
      setName('');
      if (presetParams.cropId === 'banana_special') {
        setCropId('banana');
        setBananaPlan('special');
      } else {
        setCropId(presetParams.cropId);
        setBananaPlan('standard');
      }
      setSowingDate(presetParams.sowingDate);
      setAreaText(String(presetParams.areaValue));
      setAreaUnit(presetParams.areaUnit);
      setRemindersEnabled(true);
    } else {
      setName('');
      setCropId('wheat');
      setBananaPlan('standard');
      setSowingDate(getTodayISO());
      setAreaText('1');
      setAreaUnit('acre');
      setRemindersEnabled(true);
    }
  }, [visible, initialField, presetParams]);

  const effectiveCropId: CropId =
    cropId === 'banana'
      ? bananaPlan === 'special'
        ? 'banana_special'
        : 'banana'
      : cropId;

  const selectedCrop = CROPS[effectiveCropId];
  const lastStageDay =
    selectedCrop.stages[selectedCrop.stages.length - 1]?.daysAfterSowing ?? 0;

  const parsedArea = useMemo(() => {
    const n = parseFloat(areaText.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [areaText]);

  const handleSave = () => {
    const cropLabel = pickText(language, selectedCrop.name, selectedCrop.hiName, selectedCrop.mrName);
    const trimmedName = name.trim() || `${cropLabel} (${parsedArea} ${t.units[areaUnit]})`;
    onSave({
      id: initialField?.id,
      name: trimmedName,
      cropId: effectiveCropId,
      sowingDate,
      areaValue: parsedArea,
      areaUnit,
      remindersEnabled,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialField ? t.common.edit : t.common.addField}
          </Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Plot Name */}
          <Text style={styles.label}>{t.common.fieldName}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.common.fieldNamePlaceholder}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Crop Selector */}
          <Text style={styles.label}>{t.common.selectCrop}</Text>
          <View style={styles.cropGrid}>
            {CROP_LIST.map((crop) => {
              const active = crop.id === cropId;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[styles.cropCard, active && styles.cropCardActive]}
                  onPress={() => setCropId(crop.id)}
                >
                  <Text style={styles.cropEmoji}>{crop.emoji}</Text>
                  <Text
                    style={[
                      styles.cropName,
                      active && styles.cropNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {crop.id === 'banana'
                      ? pickText(language, 'Banana', 'केला', 'केळी')
                      : pickText(language, crop.name, crop.hiName, crop.mrName)}
                  </Text>
                  <Text style={styles.cropStagesCount}>
                    {crop.id === 'banana'
                      ? (bananaPlan === 'special' ? 9 : 5)
                      : crop.stages.length}{' '}
                    {pickText(language, 'doses', 'चरण', 'हप्ते')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Banana Plan Selector - Shown when Banana is selected */}
          {cropId === 'banana' && (
            <View style={styles.bananaPlanBox}>
              <View style={styles.bananaPlanHeader}>
                <Ionicons name="sparkles" size={16} color={Colors.warning} />
                <Text style={styles.bananaPlanTitle}>
                  {pickText(
                    language,
                    'Select Banana Fertilizer Plan',
                    'केला खाद नियोजन प्रकार चुनें',
                    'केळी खत नियोजन प्रकार निवडा'
                  )}
                </Text>
              </View>

              <View style={styles.bananaPlanOptions}>
                {/* Option 1: Standard Plan */}
                <TouchableOpacity
                  style={[
                    styles.bananaPlanCard,
                    bananaPlan === 'standard' && styles.bananaPlanCardActive,
                  ]}
                  onPress={() => setBananaPlan('standard')}
                  activeOpacity={0.8}
                >
                  <View style={styles.bananaPlanTop}>
                    <Ionicons
                      name={
                        bananaPlan === 'standard'
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={18}
                      color={
                        bananaPlan === 'standard'
                          ? Colors.primary
                          : Colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.bananaPlanName,
                        bananaPlan === 'standard' &&
                          styles.bananaPlanNameActive,
                      ]}
                    >
                      {pickText(
                        language,
                        '🌿 Standard Plan (5 Doses)',
                        '🌿 सामान्य योजना (5 खुराक)',
                        '🌿 सर्वसाधारण नियोजन (५ हप्ते)'
                      )}
                    </Text>
                  </View>
                  <Text style={styles.bananaPlanDesc}>
                    {pickText(
                      language,
                      'University recommendation • Straight NPK basal & top dressings',
                      'कृषि विश्वविद्यालय मानक • बेसल डीएपी व टॉप ड्रेसिंग',
                      'कृषी विद्यापीठ प्रमाणक • बेसल डीएपी व जमिनीतील मात्रा'
                    )}
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Special Jalgaon Plan */}
                <TouchableOpacity
                  style={[
                    styles.bananaPlanCard,
                    bananaPlan === 'special' && styles.bananaPlanCardActive,
                  ]}
                  onPress={() => setBananaPlan('special')}
                  activeOpacity={0.8}
                >
                  <View style={styles.bananaPlanTop}>
                    <Ionicons
                      name={
                        bananaPlan === 'special'
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={18}
                      color={
                        bananaPlan === 'special'
                          ? Colors.primary
                          : Colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.bananaPlanName,
                        bananaPlan === 'special' &&
                          styles.bananaPlanNameActive,
                      ]}
                    >
                      {pickText(
                        language,
                        '⭐ Special Jalgaon Plan (9 Doses)',
                        '⭐ विशेष जलगाँव एक्सपर्ट प्लान (9 खुराक)',
                        '⭐ विशेष जळगाव तज्ज्ञ नियोजन (९ हप्ते)'
                      )}
                    </Text>
                  </View>
                  <Text style={styles.bananaPlanDesc}>
                    {pickText(
                      language,
                      'Per 1,000 plants standard (1 Acre = 1,500 plants) • Sucker treatment, drenching, spindle filling & drip fertigation',
                      '1000 पौधों के आधार पर (1 एकड़ = 1500 पौधे) • बेणे प्रक्रिया, ड्रेंचिंग, पोगेभरण व ड्रिप',
                      'दर हजारी आधारित (१ एकर = १५०० झाडे, १ विघा = ११००-१२००) • बेणे प्रक्रिया, ड्रेंचिंग, पोगेभरणे व ड्रिप'
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sowing Date */}
          <Text style={styles.label}>{t.common.sowingDate}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setDateModalOpen(true)}
          >
            <View style={styles.dateLeft}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateValue}>
                {formatReadableDate(sowingDate, language)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Farm Area & Unit */}
          <Text style={styles.label}>{t.common.area}</Text>
          <View style={styles.areaRow}>
            <TextInput
              style={[styles.input, styles.areaInput]}
              value={areaText}
              onChangeText={setAreaText}
              keyboardType="decimal-pad"
              placeholder="1.0"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.unitGroup}>
              {AREA_UNITS.map((u) => {
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

          {/* Schedule Preview Banner */}
          <View style={styles.previewBanner}>
            <Ionicons name="sparkles" size={18} color={Colors.primaryDark} />
            <Text style={styles.previewText}>
              {pickText(
                language,
                `${selectedCrop.stages.length} automatic fertilizer stages from ${formatReadableDate(
                  sowingDate,
                  language
                )} to ${formatReadableDate(
                  addDaysISO(sowingDate, lastStageDay),
                  language
                )}`,
                `${selectedCrop.stages.length} ऑटोमैटिक खाद चरण: ${formatReadableDate(
                  sowingDate,
                  language
                )} से ${formatReadableDate(
                  addDaysISO(sowingDate, lastStageDay),
                  language
                )} तक`,
                `${selectedCrop.stages.length} स्वयंचलित खत हप्ते: ${formatReadableDate(
                  sowingDate,
                  language
                )} ते ${formatReadableDate(
                  addDaysISO(sowingDate, lastStageDay),
                  language
                )} पर्यंत`
              )}
            </Text>
          </View>

          {/* Reminders Toggle */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.switchTitle}>{t.common.reminders}</Text>
              <Text style={styles.switchSub}>{t.settings.reminderTimeDesc}</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: Colors.border, true: '#86EFAC' }}
              thumbColor={remindersEnabled ? Colors.primary : '#F4F4F5'}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{t.common.save}</Text>
          </TouchableOpacity>
        </View>

        <DatePickerModal
          visible={dateModalOpen}
          value={sowingDate}
          language={language}
          onSelect={setSowingDate}
          onClose={() => setDateModalOpen(false)}
        />
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropCard: {
    width: '31.5%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cropCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  cropEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cropNameActive: {
    color: Colors.primaryDark,
  },
  cropStagesCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bananaPlanBox: {
    marginTop: 10,
    backgroundColor: '#F7FAF7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
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
  bananaPlanOptions: {
    gap: 8,
  },
  bananaPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  bananaPlanCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '40',
  },
  bananaPlanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  bananaPlanName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bananaPlanNameActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  bananaPlanDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginLeft: 26,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  areaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  areaInput: {
    width: 96,
    textAlign: 'center',
    fontWeight: '700',
  },
  unitGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 9,
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
  previewBanner: {
    marginTop: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  switchRow: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
