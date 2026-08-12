// CoursesScreen.js
// Explora los cursos activos de Canvas y las tareas (assignments) de cada
// uno, usando getCourses()/getAssignments() de canvasApi.js — endpoints que
// ya existían pero no se usaban desde ninguna pantalla. Complementa a
// TasksScreen.js (que solo muestra el to-do list): aquí se ven TODAS las
// tareas de un curso, no solo las pendientes.
//
// Reutiliza la misma lógica de "Programar bloque de trabajo" y "Entregar
// tarea" que TasksScreen.js, vía useWorkBlockScheduler.js y
// useAssignmentSubmission.js.

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getCourses, getAssignments } from './canvasApi';
import { SchedulePickerModal } from './schedulePicker';
import { useWorkBlockScheduler } from './useWorkBlockScheduler';
import { useAssignmentSubmission } from './useAssignmentSubmission';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, colorFromString } from './theme';

export default function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const scheduler = useWorkBlockScheduler();
  const submission = useAssignmentSubmission();

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setCourses(await getCourses());
      } catch (err) {
        setError(String(err.message || err));
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  async function openCourse(course) {
    setSelectedCourse(course);
    setLoadingAssignments(true);
    try {
      setAssignments(await getAssignments(course.id));
    } catch (err) {
      Alert.alert('Error cargando tareas', String(err.message || err));
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }

  function closeCourse() {
    setSelectedCourse(null);
    setAssignments([]);
  }

  if (loadingCourses) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (selectedCourse) {
    const courseColor = colorFromString(selectedCourse.name);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppButton title="‹ Cursos" onPress={closeCourse} variant="plain" />
        </View>
        <View style={styles.courseTitleRow}>
          <View style={[styles.courseDot, { backgroundColor: courseColor }]} />
          <Text style={[typography.screenTitle, styles.title]}>{selectedCourse.name}</Text>
        </View>

        {loadingAssignments ? (
          <ActivityIndicator style={styles.spacerTop} color={colors.accent} />
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(a) => String(a.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.empty}>Este curso no tiene tareas</Text>}
            renderItem={({ item }) => {
              const types = item.submission_types || [];
              const canSubmit =
                types.includes('online_text_entry') ||
                types.includes('online_url') ||
                types.includes('online_upload');

              return (
                <View style={[styles.card, { borderLeftColor: courseColor }]}>
                  <Text style={typography.cardTitle}>{item.name}</Text>
                  {item.due_at && (
                    <Text style={styles.cardDue}>Vence: {new Date(item.due_at).toLocaleString()}</Text>
                  )}
                  <View style={styles.actions}>
                    <AppButton
                      title={scheduler.scheduling === item.id ? 'Programando...' : 'Programar bloque de trabajo'}
                      onPress={() => scheduler.scheduleWorkBlock(item)}
                      disabled={Boolean(scheduler.scheduling)}
                      loading={scheduler.scheduling === item.id}
                    />
                    {canSubmit && (
                      <AppButton
                        title={submission.submitting === item.id ? 'Entregando...' : 'Entregar tarea'}
                        onPress={() => submission.handleSubmit(item)}
                        disabled={Boolean(submission.submitting)}
                        loading={submission.submitting === item.id}
                      />
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        <SchedulePickerModal
          visible={scheduler.showIosPicker}
          label={scheduler.pendingItem ? `¿Cuándo empiezas "${scheduler.pendingItem.assignment?.name}"?` : ''}
          initialDate={scheduler.initialDate}
          onConfirm={scheduler.confirmIosPicker}
          onCancel={scheduler.cancelIosPicker}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.screenTitle, styles.title]}>Tus cursos</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={courses}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!error && <Text style={styles.empty}>No tienes cursos activos</Text>}
        renderItem={({ item }) => {
          const courseColor = colorFromString(item.name);
          return (
            <View style={[styles.card, { borderLeftColor: courseColor }]}>
              <Text style={typography.cardTitle}>{item.name}</Text>
              {item.course_code && (
                <Text style={[styles.cardCourse, { color: courseColor }]}>{item.course_code}</Text>
              )}
              <View style={styles.actions}>
                <AppButton title="Ver tareas" onPress={() => openCourse(item)} />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 50, paddingHorizontal: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', marginBottom: spacing.xs },
  courseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  courseDot: { width: 12, height: 12, borderRadius: 6 },
  title: { marginBottom: 0 },
  error: { color: colors.danger, marginBottom: spacing.sm },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textSecondary },
  spacerTop: { marginTop: spacing.xl },
  listContent: { gap: spacing.md, paddingBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardDue: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  cardCourse: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
