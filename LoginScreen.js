// LoginScreen.js
// Formulario simple para guardar el token de Canvas cifrado en el dispositivo.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saveCredentials } from './canvasApi';
import AppButton from './AppButton';
import { colors, radius, spacing, gradients } from './theme';

export default function LoginScreen({ onSaved }) {
  const [baseUrl, setBaseUrl] = useState('https://umb.instructure.com');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(null);

  async function handleSave() {
    if (!token.trim() || !baseUrl.trim()) {
      Alert.alert('Faltan datos', 'Ingresa la URL de tu institución y tu token.');
      return;
    }
    setSaving(true);
    try {
      await saveCredentials(token.trim(), baseUrl.trim());
      onSaved();
    } catch (err) {
      Alert.alert('Error guardando credenciales', String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
          <Text style={styles.badgeIcon}>📋</Text>
        </LinearGradient>
        <Text style={styles.title}>Canvas Dashboard</Text>
        <Text style={styles.subtitle}>Conecta con Canvas para ver tus tareas pendientes</Text>

        <View style={styles.field}>
          <Text style={styles.label}>URL de tu institución</Text>
          <TextInput
            style={[styles.input, focused === 'url' && styles.inputFocused]}
            value={baseUrl}
            onChangeText={setBaseUrl}
            onFocus={() => setFocused('url')}
            onBlur={() => setFocused(null)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://tuuniversidad.instructure.com"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Access Token</Text>
          <TextInput
            style={[styles.input, focused === 'token' && styles.inputFocused]}
            value={token}
            onChangeText={setToken}
            onFocus={() => setFocused('token')}
            onBlur={() => setFocused(null)}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Pega aquí tu token"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={styles.hint}>
            ✓ Tu token se guarda cifrado en este dispositivo y nunca se comparte. Genera uno en Canvas: Perfil {'>'}{' '}
            Configuración {'>'} New Access Token, con fecha de expiración.
          </Text>
        </View>

        <AppButton
          title="Guardar y continuar"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          variant="primary"
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeIcon: { fontSize: 30 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', letterSpacing: -0.4 },
  subtitle: {
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.fill,
    borderRadius: radius.input,
    padding: 13,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.accent },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  submitButton: { marginTop: spacing.sm },
});
