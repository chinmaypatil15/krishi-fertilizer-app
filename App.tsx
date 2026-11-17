import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AddFieldModal } from './src/components/AddFieldModal';
import { TRANSLATIONS } from './src/i18n/translations';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FieldDetailScreen } from './src/screens/FieldDetailScreen';
import { FieldsScreen } from './src/screens/FieldsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Colors } from './src/theme/colors';
import {
  AlternativeOption,
  AppSettings,
  AreaUnit,
  AuthUser,
  CropId,
  FarmerField,
  FertilizerId,
} from './src/types';
import { buildFieldSummary, getTodayISO } from './src/utils/calculations';
import {
  cancelFieldNotifications,
  configureNotificationHandler,
  syncFieldNotifications,
} from './src/utils/notifications';
import {
  clearAuthUser,
  createSampleFields,
  DEFAULT_SETTINGS,
  loadAuthUser,
  loadFields,
  loadSettings,
  saveAuthUser,
  saveFields,
  saveSettings,
} from './src/utils/storage';

type TabKey = 'home' | 'fields' | 'calculator' | 'settings';

configureNotificationHandler();

function MainApp() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FarmerField[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<FarmerField | null>(null);
  const [presetParams, setPresetParams] = useState<{
    cropId: CropId;
    sowingDate: string;
    areaValue: number;
    areaUnit: AreaUnit;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [loadedFields, loadedSettings, loadedUser] = await Promise.all([
        loadFields(),
        loadSettings(),
        loadAuthUser(),
      ]);
      setFields(loadedFields);
      setSettings(loadedSettings);
      setAuthUser(loadedUser);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedFieldId) {
        setSelectedFieldId(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedFieldId]);

  const summaries = useMemo(
    () => fields.map((f) => buildFieldSummary(f, settings)),
    [fields, settings]
  );

  const selectedSummary = useMemo(
    () => summaries.find((s) => s.field.id === selectedFieldId) ?? null,
    [summaries, selectedFieldId]
  );

  const persistFields = useCallback(async (next: FarmerField[]) => {
    setFields(next);
    await saveFields(next);
  }, []);

  const handleUpdateSettings = useCallback(
    async (next: AppSettings) => {
      setSettings(next);
      await saveSettings(next);
    },
    []
  );

  const toggleLanguage = () => {
    const nextLang =
      settings.language === 'en'
        ? 'hi'
        : settings.language === 'hi'
        ? 'mr'
        : 'en';
    handleUpdateSettings({
      ...settings,
      language: nextLang,
    });
  };

  const handleOpenAddModal = () => {
    setEditingField(null);
    setPresetParams(null);
    setModalVisible(true);
  };

  const handleSaveField = async (data: {
    id?: string;
    name: string;
    cropId: CropId;
    sowingDate: string;
    areaValue: number;
    areaUnit: AreaUnit;
    remindersEnabled: boolean;
  }) => {
    let savedField: FarmerField;
    let nextFields: FarmerField[];

    if (data.id) {
      const existing = fields.find((f) => f.id === data.id);
      const cropChanged = existing && existing.cropId !== data.cropId;
      const areaChanged =
        existing &&
        (existing.areaValue !== data.areaValue || existing.areaUnit !== data.areaUnit);
      savedField = {
        id: data.id,
        name: data.name,
        cropId: data.cropId,
        sowingDate: data.sowingDate,
        areaValue: data.areaValue,
        areaUnit: data.areaUnit,
        remindersEnabled: data.remindersEnabled,
        completedStageIds: cropChanged ? [] : existing?.completedStageIds ?? [],
        completedDates: cropChanged ? {} : existing?.completedDates ?? {},
        stageOverrides:
          cropChanged || areaChanged ? undefined : existing?.stageOverrides,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      nextFields = fields.map((f) => (f.id === data.id ? savedField : f));
    } else {
      savedField = {
        id: `field-${Date.now()}`,
        name: data.name,
        cropId: data.cropId,
        sowingDate: data.sowingDate,
        areaValue: data.areaValue,
        areaUnit: data.areaUnit,
        completedStageIds: [],
        completedDates: {},
        remindersEnabled: data.remindersEnabled,
        createdAt: new Date().toISOString(),
      };
      nextFields = [savedField, ...fields];
    }

    setModalVisible(false);
    setEditingField(null);
    setPresetParams(null);
    await persistFields(nextFields);

    const summary = buildFieldSummary(savedField, settings);
    await syncFieldNotifications(summary, settings);

    setSelectedFieldId(savedField.id);
    setActiveTab('fields');
  };

  const handleToggleStageDone = async (fieldId: string, stageId: string) => {
    const today = getTodayISO();
    let updatedField: FarmerField | null = null;
    const nextFields = fields.map((f) => {
      if (f.id !== fieldId) return f;
      const done = f.completedStageIds.includes(stageId);
      const completedStageIds = done
        ? f.completedStageIds.filter((id) => id !== stageId)
        : [...f.completedStageIds, stageId];
      const completedDates = { ...f.completedDates };
      if (done) {
        delete completedDates[stageId];
      } else {
        completedDates[stageId] = today;
      }
      updatedField = { ...f, completedStageIds, completedDates };
      return updatedField;
    });

    await persistFields(nextFields);
    if (updatedField) {
      await syncFieldNotifications(
        buildFieldSummary(updatedField, settings),
        settings
      );
    }
  };

  const handleToggleReminders = async (fieldId: string) => {
    let updatedField: FarmerField | null = null;
    const nextFields = fields.map((f) => {
      if (f.id !== fieldId) return f;
      updatedField = { ...f, remindersEnabled: !f.remindersEnabled };
      return updatedField;
    });
    await persistFields(nextFields);
    if (updatedField) {
      await syncFieldNotifications(
        buildFieldSummary(updatedField, settings),
        settings
      );
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    await cancelFieldNotifications(fieldId);
    const nextFields = fields.filter((f) => f.id !== fieldId);
    setSelectedFieldId(null);
    await persistFields(nextFields);
  };

  const handleApplyStageAlternative = async (
    fieldId: string,
    stageId: string,
    option: AlternativeOption,
    unavailableIds: FertilizerId[]
  ) => {
    let updatedField: FarmerField | null = null;
    const nextFields = fields.map((f) => {
      if (f.id !== fieldId) return f;
      updatedField = {
        ...f,
        stageOverrides: {
          ...(f.stageOverrides ?? {}),
          [stageId]: {
            optionTitle: option.title,
            hiOptionTitle: option.hiTitle,
            mrOptionTitle: option.mrTitle,
            unavailableIds,
            items: option.items,
            totalCost: option.totalCost,
            totalNpk: option.totalNpk,
            note: option.note,
            hiNote: option.hiNote,
            mrNote: option.mrNote,
          },
        },
      };
      return updatedField;
    });
    await persistFields(nextFields);
    if (updatedField) {
      await syncFieldNotifications(
        buildFieldSummary(updatedField, settings),
        settings
      );
    }
  };

  const handleResetStageAlternative = async (
    fieldId: string,
    stageId: string
  ) => {
    let updatedField: FarmerField | null = null;
    const nextFields = fields.map((f) => {
      if (f.id !== fieldId) return f;
      const nextOverrides = { ...(f.stageOverrides ?? {}) };
      delete nextOverrides[stageId];
      updatedField = {
        ...f,
        stageOverrides:
          Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined,
      };
      return updatedField;
    });
    await persistFields(nextFields);
    if (updatedField) {
      await syncFieldNotifications(
        buildFieldSummary(updatedField, settings),
        settings
      );
    }
  };

  const handleLoadSampleData = async () => {
    const samples = createSampleFields();
    const nextFields = [...samples, ...fields];
    await persistFields(nextFields);
    for (const s of samples) {
      await syncFieldNotifications(buildFieldSummary(s, settings), settings);
    }
    setActiveTab('home');
  };

  const handleClearAllFields = async () => {
    await Promise.all(fields.map((f) => cancelFieldNotifications(f.id)));
    setSelectedFieldId(null);
    await persistFields([]);
  };

  const handleLoginSuccess = async (user: AuthUser) => {
    setAuthUser(user);
    setIsGuest(false);
    await saveAuthUser(user);
  };

  const handleLogout = async () => {
    setAuthUser(null);
    setIsGuest(false);
    await clearAuthUser();
  };

  const t = TRANSLATIONS[settings.language];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!authUser && !isGuest) {
    return (
      <LoginScreen
        language={settings.language}
        onSelectLanguage={(nextLang) => {
          handleUpdateSettings({ ...settings, language: nextLang });
        }}
        onLoginSuccess={handleLoginSuccess}
        onSkipGuest={() => setIsGuest(true)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* App Header */}
      {!selectedSummary && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🌾 {t.appName}</Text>
            <Text style={styles.headerSub}>
              {authUser?.fullName ? `👨‍🌾 ${authUser.fullName}` : t.appSubtitle}
            </Text>
          </View>
          <TouchableOpacity style={styles.langPill} onPress={toggleLanguage}>
            <Ionicons name="language" size={15} color="#FFFFFF" />
            <Text style={styles.langPillText}>
              {settings.language === 'en'
                ? 'EN'
                : settings.language === 'hi'
                ? 'हिं'
                : 'मरा'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active View */}
      <View style={styles.body}>
        {selectedSummary ? (
          <FieldDetailScreen
            summary={selectedSummary}
            settings={settings}
            onBack={() => setSelectedFieldId(null)}
            onEdit={() => {
              setEditingField(selectedSummary.field);
              setPresetParams(null);
              setModalVisible(true);
            }}
            onDelete={() => handleDeleteField(selectedSummary.field.id)}
            onToggleStageDone={(stageId) =>
              handleToggleStageDone(selectedSummary.field.id, stageId)
            }
            onToggleReminders={() =>
              handleToggleReminders(selectedSummary.field.id)
            }
            onApplyStageAlternative={(stageId, option, unavailableIds) =>
              handleApplyStageAlternative(
                selectedSummary.field.id,
                stageId,
                option,
                unavailableIds
              )
            }
            onResetStageAlternative={(stageId) =>
              handleResetStageAlternative(selectedSummary.field.id, stageId)
            }
          />
        ) : activeTab === 'home' ? (
          <DashboardScreen
            summaries={summaries}
            settings={settings}
            farmerName={authUser?.fullName}
            onOpenAddField={handleOpenAddModal}
            onSelectField={(id) => setSelectedFieldId(id)}
            onToggleStageDone={handleToggleStageDone}
            onLoadSampleData={handleLoadSampleData}
          />
        ) : activeTab === 'fields' ? (
          <FieldsScreen
            summaries={summaries}
            settings={settings}
            farmerName={authUser?.fullName}
            onOpenAddField={handleOpenAddModal}
            onSelectField={(id) => setSelectedFieldId(id)}
          />
        ) : activeTab === 'calculator' ? (
          <CalculatorScreen
            settings={settings}
            onSaveAsField={(preset) => {
              setEditingField(null);
              setPresetParams(preset);
              setModalVisible(true);
            }}
          />
        ) : (
          <SettingsScreen
            settings={settings}
            authUser={authUser}
            onUpdateSettings={handleUpdateSettings}
            onLoadSampleData={handleLoadSampleData}
            onClearAllFields={handleClearAllFields}
            onLogout={handleLogout}
            onOpenLogin={() => setIsGuest(false)}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      {!selectedSummary && (
        <View style={styles.tabBar}>
          {(
            [
              { key: 'home', label: t.tabs.home, icon: 'home' },
              { key: 'fields', label: t.tabs.fields, icon: 'leaf' },
              { key: 'calculator', label: t.tabs.calculator, icon: 'calculator' },
              { key: 'settings', label: t.tabs.settings, icon: 'settings' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={active ? tab.icon : (`${tab.icon}-outline` as never)}
                  size={22}
                  color={active ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <AddFieldModal
        visible={modalVisible}
        language={settings.language}
        initialField={editingField}
        presetParams={presetParams}
        onSave={handleSaveField}
        onClose={() => {
          setModalVisible(false);
          setEditingField(null);
          setPresetParams(null);
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: '#CBEAD6',
    fontSize: 12,
    marginTop: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
