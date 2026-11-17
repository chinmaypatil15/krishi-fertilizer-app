import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
import { FERTILIZERS } from '../data/crops';
import { pickText, TRANSLATIONS } from '../i18n/translations';
import { Colors } from '../theme/colors';
import { AppSettings, AuthUser, FertilizerId, Language } from '../types';
import { getDefaultFertilizerPrices } from '../utils/storage';

interface Props {
  settings: AppSettings;
  authUser: AuthUser | null;
  onUpdateSettings: (next: AppSettings) => void;
  onLoadSampleData: () => void;
  onClearAllFields: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  settings,
  authUser,
  onUpdateSettings,
  onLoadSampleData,
  onClearAllFields,
  onLogout,
  onOpenLogin,
}) => {
  const lang = settings.language;
  const t = TRANSLATIONS[lang];

  const setLanguage = (nextLang: Language) => {
    onUpdateSettings({ ...settings, language: nextLang });
  };

  const updatePrice = (id: FertilizerId, text: string) => {
    const num = parseFloat(text);
    const safe = Number.isFinite(num) && num >= 0 ? num : 0;
    onUpdateSettings({
      ...settings,
      fertilizerPrices: {
        ...settings.fertilizerPrices,
        [id]: safe,
      },
    });
  };

  const resetPrices = () => {
    onUpdateSettings({
      ...settings,
      fertilizerPrices: getDefaultFertilizerPrices(),
    });
  };

  const handleClearConfirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t.settings.clearConfirm)) {
        onClearAllFields();
      }
      return;
    }
    Alert.alert(t.settings.clearAll, t.settings.clearConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: onClearAllFields },
    ]);
  };

  const fertilizerList = Object.values(FERTILIZERS);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t.settings.title}</Text>

      {/* Farmer Profile / Account Card */}
      {authUser ? (
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarEmoji}>👨‍🌾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.farmerName}>
                  {authUser.fullName ||
                    pickText(
                      lang,
                      'Farmer Friend',
                      'किसान मित्र',
                      'शेतकरी मित्र'
                    )}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                  <Text style={styles.verifiedBadgeText}>
                    {t.auth.verifiedBadge}
                  </Text>
                </View>
              </View>
              <Text style={styles.farmerPhone}>
                🇮🇳 +91 {authUser.phoneNumber}
              </Text>
              {!!authUser.village && (
                <Text style={styles.farmerVillage}>
                  📍 {authUser.village}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm(t.auth.logoutConfirm)) {
                  onLogout();
                }
                return;
              }
              Alert.alert(t.auth.logout, t.auth.logoutConfirm, [
                { text: t.common.cancel, style: 'cancel' },
                {
                  text: t.auth.logout,
                  style: 'destructive',
                  onPress: onLogout,
                },
              ]);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.danger} />
            <Text style={styles.logoutBtnText}>{t.auth.logout}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.guestCardTitle}>{t.auth.guestBadge}</Text>
            </View>
            <Text style={styles.guestCardSub}>
              {pickText(
                lang,
                'Login with mobile OTP to save your profile & get personalized SMS reminders.',
                'अपनी प्रोफ़ाइल सहेजने और व्यक्तिगत अलर्ट हेतु मोबाइल ओटीपी से लॉगिन करें।',
                'आपली प्रोफाईल सुरक्षित ठेवण्यासाठी व वैयक्तिक अलर्टसाठी मोबाईल ओटीपीने लॉगिन करा.'
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={onOpenLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
            <Text style={styles.signInBtnText}>
              {pickText(lang, 'Sign In', 'लॉगिन', 'लॉगिन करा')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Language Toggle */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.settings.languageSection}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.langBtnText,
                lang === 'en' && styles.langBtnTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
            onPress={() => setLanguage('hi')}
          >
            <Text
              style={[
                styles.langBtnText,
                lang === 'hi' && styles.langBtnTextActive,
              ]}
            >
              हिन्दी
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'mr' && styles.langBtnActive]}
            onPress={() => setLanguage('mr')}
          >
            <Text
              style={[
                styles.langBtnText,
                lang === 'mr' && styles.langBtnTextActive,
              ]}
            >
              मराठी
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminder Schedule Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.settings.notificationsSection}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t.settings.reminderTime}</Text>
            <Text style={styles.infoSub}>{t.settings.reminderTimeDesc}</Text>
          </View>
        </View>
      </View>

      {/* Fertilizer Bag Prices */}
      <View style={styles.card}>
        <View style={styles.priceHeader}>
          <Text style={styles.cardTitle}>{t.settings.pricesSection}</Text>
          <TouchableOpacity onPress={resetPrices}>
            <Text style={styles.resetLink}>{t.settings.resetPrices}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDesc}>{t.settings.pricesDesc}</Text>

        <View style={styles.priceList}>
          {fertilizerList.map((f) => {
            const currentVal = settings.fertilizerPrices[f.id] ?? f.defaultPricePerBag;
            return (
              <View key={f.id} style={styles.priceRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.fertName}>
                    {pickText(lang, f.name, f.hiName, f.mrName)}
                  </Text>
                  <Text style={styles.fertBag}>
                    {f.bagWeightKg} {t.common.kg} / {t.common.bag}
                  </Text>
                </View>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.currencyPrefix}>
                    {settings.currencySymbol}
                  </Text>
                  <TextInput
                    style={styles.priceInput}
                    value={String(currentVal)}
                    onChangeText={(txt) => updatePrice(f.id, txt)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Sample / Reset Data */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.settings.demoSection}</Text>
        <TouchableOpacity style={styles.demoBtn} onPress={onLoadSampleData}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.primaryDark} />
          <Text style={styles.demoBtnText}>{t.settings.loadDemo}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearConfirm}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.clearBtnText}>{t.settings.clearAll}</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 36,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  priceList: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fertName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fertBag: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 88,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 2,
  },
  demoBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  demoBtnText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  clearBtnText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '35',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  farmerPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  farmerVillage: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.danger,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  guestCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 4,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
