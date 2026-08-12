// useAssignmentSubmission.js
// Hook reutilizable: entrega una tarea (assignment) de Canvas por texto, URL
// o archivo (elegido con expo-document-picker). Usado por TasksScreen.js y
// CoursesScreen.js.

import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { submitTextEntry, submitUrl, submitFile } from './canvasApi';

export function useAssignmentSubmission(onSubmitted) {
  const [submitting, setSubmitting] = useState(null); // id del assignment en proceso

  function handleSubmit(assignment) {
    const types = assignment?.submission_types || [];
    const canText = types.includes('online_text_entry');
    const canUrl = types.includes('online_url');
    const canFile = types.includes('online_upload');

    if (!canText && !canUrl && !canFile) {
      Alert.alert(
        'Entrega no soportada',
        'Esta tarea requiere un tipo de entrega que la app no soporta todavía.'
      );
      return;
    }

    const options = [];
    if (canFile) options.push({ text: 'Por archivo', onPress: () => pickAndSubmitFile(assignment) });
    if (canUrl) options.push({ text: 'Por URL', onPress: () => promptSubmission(assignment, 'url') });
    if (canText) options.push({ text: 'Por texto', onPress: () => promptSubmission(assignment, 'text') });
    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(
      'Tipo de entrega',
      `¿Cómo quieres entregar "${assignment?.name ?? 'esta tarea'}"?`,
      options
    );
  }

  function promptSubmission(assignment, kind) {
    const title = kind === 'url' ? 'Entregar por URL' : 'Entregar por texto';
    const message = kind === 'url' ? 'Pega el link de tu entrega' : 'Escribe el contenido de tu entrega';

    Alert.prompt(title, message, (value) => {
      if (!value) return;
      doSubmit(assignment, kind, value);
    });
  }

  async function pickAndSubmitFile(assignment) {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file) return;
    doSubmit(assignment, 'file', file);
  }

  async function doSubmit(assignment, kind, value) {
    setSubmitting(assignment.id);
    try {
      if (kind === 'url') {
        await submitUrl(assignment.course_id, assignment.id, value);
      } else if (kind === 'file') {
        await submitFile(assignment.course_id, assignment.id, value);
      } else {
        await submitTextEntry(assignment.course_id, assignment.id, value);
      }
      Alert.alert('Entregado', 'Tu entrega se envió a Canvas.');
      onSubmitted?.();
    } catch (err) {
      Alert.alert('Error al entregar', String(err.message || err));
    } finally {
      setSubmitting(null);
    }
  }

  return { submitting, handleSubmit };
}
