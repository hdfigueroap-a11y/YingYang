// backup.js
// Respaldo/restauración de Finanzas y Horario — las dos bases de datos que
// solo existen en el dispositivo (SQLite local, sin sincronizar a ningún
// lado). Exporta todo a un archivo JSON y lo comparte con la hoja de
// compartir nativa de iOS (Guardar en Archivos, mandarlo por correo, subirlo
// a iCloud Drive, etc.) — el archivo nunca sale del control del usuario
// salvo que él decida compartirlo. Restaurar reemplaza TODOS los datos
// actuales por los del archivo, no los combina — se avisa antes en la UI
// (SettingsScreen.js).

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportAllData as exportFinance, importAllData as importFinance } from './financeDb';
import { exportAllClasses, importAllClasses } from './scheduleDb';

const BACKUP_VERSION = 1;

export async function exportBackup() {
  const [finance, schedule] = await Promise.all([exportFinance(), exportAllClasses()]);
  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    finance,
    schedule,
  };

  const fileName = `canvas-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.document, fileName);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Guardar respaldo' });
  }
  return file.uri;
}

// Abre el selector de archivos y devuelve el respaldo ya leído/parseado, o
// `null` si el usuario cancela. Tira error si el archivo no es un JSON
// válido o es de otra versión — la pantalla lo muestra con Alert.
export async function pickBackupFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled) return null;

  const picked = result.assets?.[0];
  if (!picked) return null;

  const file = new File(picked.uri);
  const content = await file.text();
  const payload = JSON.parse(content);

  if (payload.version !== BACKUP_VERSION) {
    throw new Error('Este archivo es de una versión de respaldo distinta — no se puede restaurar.');
  }
  return payload;
}

export async function restoreBackup(payload) {
  await importFinance(payload.finance || {});
  await importAllClasses(payload.schedule || []);
}
