import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatStr, pickText, TRANSLATIONS } from '../i18n/translations';
import { sendFirebaseOtp, verifyFirebaseOtp } from '../services/firebaseAuth';
import { Colors } from '../theme/colors';
import { AuthUser, Language } from '../types';

interface Props {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onLoginSuccess: (user: AuthUser) => void;
  onSkipGuest: () => void;
}

export const LoginScreen: React.FC<Props> = ({
  language,
  onSelectLanguage,
  onLoginSuccess,
  onSkipGuest,
}) => {
  const t = TRANSLATIONS[language];

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [verificationSession, setVerificationSession] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const otpInputRef = useRef<any>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 'otp' || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Clean phone string (digits only)
  const cleanPhone = useMemo(() => {
    return phoneNumber.replace(/[^0-9]/g, '');
  }, [phoneNumber]);

  const expectedOtpLength = 6;

  const handleSendOtp = async () => {
    setErrorMessage('');
    if (cleanPhone.length !== 10) {
      setErrorMessage(t.auth.invalidPhone);
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendFirebaseOtp(cleanPhone, language);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send OTP via Firebase');
        return;
      }

      setVerificationSession(res.verificationId || '');
      setStep('otp');
      setOtpValue('');
      setTimerSeconds(30);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error communicating with Google Firebase');
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendFirebaseOtp(cleanPhone, language);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to resend OTP via Firebase');
        return;
      }

      setVerificationSession(res.verificationId || '');
      setTimerSeconds(30);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error resending OTP');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const cleanOtp = otpValue.trim();

    if (cleanOtp.length !== expectedOtpLength) {
      setErrorMessage(t.auth.invalidOtp);
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyFirebaseOtp(verificationSession, cleanOtp, cleanPhone, language);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || t.auth.invalidOtp);
        return;
      }

      const user: AuthUser = {
        id: res.uid || `farmer-${cleanPhone}-${Date.now()}`,
        phoneNumber: cleanPhone,
        countryCode: '+91',
        fullName: fullName.trim() || undefined,
        village: village.trim() || undefined,
        isVerified: true,
        token: res.idToken || `firebase-jwt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error verifying with Firebase');
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language =
      language === 'en' ? 'hi' : language === 'hi' ? 'mr' : 'en';
    onSelectLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Language Toggle */}
          <View style={styles.topBar}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeEmoji}>🌾</Text>
              <Text style={styles.logoBadgeText}>{t.appName}</Text>
            </View>

            <TouchableOpacity style={styles.langPill} onPress={toggleLanguage}>
              <Ionicons name="language" size={15} color={Colors.primaryDark} />
              <Text style={styles.langPillText}>
                {language === 'en'
                  ? 'English'
                  : language === 'hi'
                  ? 'हिन्दी'
                  : 'मराठी'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <View style={styles.headerBox}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="phone-portrait" size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.firebaseTag}>
                    <Ionicons name="flame" size={13} color="#EA580C" />
                    <Text style={styles.firebaseTagText}>
                      Google Firebase Phone Auth
                    </Text>
                  </View>
                  <Text style={styles.title}>{t.auth.loginTitle}</Text>
                  <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
                </View>

                {/* Mobile Number Input */}
                <Text style={styles.inputLabel}>{t.auth.phoneLabel} *</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={(txt) => {
                      setPhoneNumber(txt);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Farmer Name (Optional) */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                  {t.auth.nameLabel}
                </Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={t.auth.namePlaceholder}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Village (Optional) */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                  {t.auth.villageLabel}
                </Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={village}
                    onChangeText={setVillage}
                    placeholder={t.auth.villagePlaceholder}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Error Banner */}
                {!!errorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    cleanPhone.length !== 10 && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={cleanPhone.length !== 10 || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>{t.auth.getOtp}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Skip / Continue as Guest */}
                <TouchableOpacity
                  style={styles.guestBtn}
                  onPress={onSkipGuest}
                  activeOpacity={0.7}
                >
                  <Text style={styles.guestBtnText}>{t.auth.skipGuest}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.headerBox}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.firebaseTag}>
                    <Ionicons name="flame" size={13} color="#EA580C" />
                    <Text style={styles.firebaseTagText}>
                      Google Firebase Cloud SMS
                    </Text>
                  </View>
                  <Text style={styles.title}>{t.auth.enterOtp}</Text>
                  <View style={styles.phoneChangeRow}>
                    <Text style={styles.subtitle}>
                      {formatStr(t.auth.otpSentTo, { phone: cleanPhone })}
                    </Text>
                    <TouchableOpacity
                      style={styles.editPhoneBtn}
                      onPress={() => {
                        setStep('phone');
                        setErrorMessage('');
                      }}
                    >
                      <Ionicons name="pencil" size={13} color={Colors.primary} />
                      <Text style={styles.editPhoneText}>{t.auth.changeNumber}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* OTP 6-Digit Boxes */}
                <TouchableOpacity
                  style={styles.otpBoxesRow}
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                >
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const digit = otpValue[idx] ?? '';
                    const isFocused = otpValue.length === idx;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          isFocused ? styles.otpBoxFocused : null,
                        ]}
                      >
                        <Text style={styles.otpDigit}>{digit}</Text>
                      </View>
                    );
                  })}
                </TouchableOpacity>

                {/* Hidden Native Input */}
                <TextInput
                  ref={otpInputRef}
                  style={styles.hiddenInput}
                  value={otpValue}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setOtpValue(clean);
                    if (errorMessage) setErrorMessage('');
                    if (clean.length === expectedOtpLength) {
                      setTimeout(() => {
                        handleVerifyOtp();
                      }, 200);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={expectedOtpLength}
                  autoFocus
                />

                {/* Error Banner */}
                {!!errorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Resend OTP Row */}
                <View style={styles.resendRow}>
                  {timerSeconds > 0 ? (
                    <Text style={styles.timerText}>
                      ⏱️ {formatStr(t.auth.resendIn, { s: timerSeconds })}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp}>
                      <Text style={styles.resendLinkText}>
                        🔄 {t.auth.resendOtp}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    otpValue.length !== expectedOtpLength && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otpValue.length !== expectedOtpLength || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>{t.auth.verifyBtn}</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Back to Phone Step */}
                <TouchableOpacity
                  style={styles.guestBtn}
                  onPress={() => {
                    setStep('phone');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.guestBtnText}>
                    {pickText(language, 'Back to Phone Input', 'फोन नंबर पर वापस जाएँ', 'मागे फोन नंबरवर जा')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer Features Info */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                {pickText(language, '100% Free & Secure', '100% मुफ़्त एवं सुरक्षित', '१००% मोफत व सुरक्षित')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                {pickText(language, 'Timely Alerts', 'समय पर रिमाइंडर', 'वेळेवर खत अलर्ट')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="leaf" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                {pickText(language, 'ICAR Baselines', 'कृषि मानक शिफारसी', 'कृषी विद्यापीठ नियोजन')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F3',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    justifyContent: 'center',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadgeEmoji: {
    fontSize: 26,
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: 0.3,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  firebaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  firebaseTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  phoneChangeRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  editPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editPhoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 18,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight + '30',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  timerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guestBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    marginTop: 8,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
