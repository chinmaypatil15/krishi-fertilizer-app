import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { Language } from '../types';
import { addDaysISO, getTodayISO, parseISODate } from '../utils/calculations';

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  language: Language;
  onSelect: (isoDate: string) => void;
  onClose: () => void;
}

const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_HI = ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'];
const WEEKDAYS_MR = ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];
const MONTH_NAMES_MR = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर',
];

export const DatePickerModal: React.FC<Props> = ({
  visible,
  value,
  language,
  onSelect,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const todayISO = getTodayISO();

  const initialDate = useMemo(() => parseISODate(value || todayISO), [value, todayISO]);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (visible) {
      const dt = parseISODate(value || todayISO);
      setViewYear(dt.getFullYear());
      setViewMonth(dt.getMonth());
    }
  }, [visible, value, todayISO]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(viewMonth + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      cells.push(`${viewYear}-${m}-${d}`);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const quickPresets = [
    { label: t.common.today, iso: todayISO },
    { label: t.common.yesterday, iso: addDaysISO(todayISO, -1) },
    {
      label: pickText(language, '7 days ago', '7 दिन पहले', '7 दिवसांपूर्वी'),
      iso: addDaysISO(todayISO, -7),
    },
    {
      label: pickText(language, '15 days ago', '15 दिन पहले', '15 दिवसांपूर्वी'),
      iso: addDaysISO(todayISO, -15),
    },
  ];

  const weekdays = language === 'mr' ? WEEKDAYS_MR : language === 'hi' ? WEEKDAYS_HI : WEEKDAYS_EN;
  const monthLabel =
    (language === 'mr' ? MONTH_NAMES_MR : language === 'hi' ? MONTH_NAMES_HI : MONTH_NAMES_EN)[viewMonth] ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.common.selectDate}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.presetsRow}>
            {quickPresets.map((preset) => {
              const active = preset.iso === value;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => {
                    onSelect(preset.iso);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      active && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.monthBar}>
            <TouchableOpacity style={styles.navBtn} onPress={goPrevMonth}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthLabel} {viewYear}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={goNextMonth}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekdays.map((wd) => (
              <Text key={wd} style={styles.weekDayText}>
                {wd}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarCells.map((iso, idx) => {
              if (!iso) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const dayNum = parseInt(iso.slice(8, 10), 10);
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              return (
                <TouchableOpacity
                  key={iso}
                  style={[
                    styles.dayCell,
                    isToday && !isSelected && styles.todayCell,
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => {
                    onSelect(iso);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && !isSelected && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 18, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.primaryDark,
  },
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  selectedCell: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
