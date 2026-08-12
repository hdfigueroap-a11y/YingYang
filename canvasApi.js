// canvasApi.js
// Centraliza todas las llamadas a la API de Canvas.
// El token nunca se escribe aquí — siempre se lee desde SecureStore.

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'canvas_token';
const BASE_URL_KEY = 'canvas_base_url';

// Guarda el token y la URL base (ej. https://umb.instructure.com) cifrados en el dispositivo
export async function saveCredentials(token, baseUrl) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(BASE_URL_KEY, baseUrl.replace(/\/$/, ''));
}

export async function getCredentials() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const baseUrl = await SecureStore.getItemAsync(BASE_URL_KEY);
  return { token, baseUrl };
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(BASE_URL_KEY);
}

// Wrapper genérico de fetch con el header de autorización ya listo.
// `options` acepta lo mismo que fetch (method, body, ...) para poder hacer
// también POST (envío de entregas), no solo GET.
async function canvasFetch(path, options = {}) {
  const { token, baseUrl } = await getCredentials();
  if (!token || !baseUrl) {
    throw new Error('No hay credenciales de Canvas guardadas todavía.');
  }

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Canvas respondió ${response.status}: ${body}`);
  }

  return response.json();
}

// Trae las tareas pendientes (to-do list) del usuario autenticado
export async function getTodoItems() {
  return canvasFetch('/users/self/todo');
}

// Trae la lista de cursos activos
export async function getCourses() {
  return canvasFetch('/courses?enrollment_state=active');
}

// Trae las tareas (assignments) de un curso específico
export async function getAssignments(courseId) {
  return canvasFetch(`/courses/${courseId}/assignments`);
}

// Envía una entrega de texto o de URL.
export async function submitTextEntry(courseId, assignmentId, body) {
  return canvasFetch(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({
      submission: { submission_type: 'online_text_entry', body },
    }),
  });
}

export async function submitUrl(courseId, assignmentId, url) {
  return canvasFetch(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({
      submission: { submission_type: 'online_url', url },
    }),
  });
}

// Sube un archivo para una tarea específica y devuelve su file_id. Sigue el
// flujo de 3 pasos que documenta Canvas para subidas de archivos:
// https://canvas.instructure.com/doc/api/file.file_uploads.html
// 1) Pedirle a Canvas una URL de subida (para ESTA tarea, no /files genérico).
// 2) Subir el archivo real a esa URL (multipart/form-data, sin el token —
//    suele ser un host de almacenamiento distinto al de la API).
// 3) Canvas devuelve el objeto de archivo ya creado; de ahí sacamos su id.
async function uploadSubmissionFile(courseId, assignmentId, file) {
  const { token, baseUrl } = await getCredentials();
  if (!token || !baseUrl) {
    throw new Error('No hay credenciales de Canvas guardadas todavía.');
  }

  const initResponse = await fetch(
    `${baseUrl}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self/files`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        content_type: file.mimeType || 'application/octet-stream',
      }),
    }
  );
  if (!initResponse.ok) {
    throw new Error(`Canvas respondió ${initResponse.status} al iniciar la subida: ${await initResponse.text()}`);
  }
  const { upload_url, upload_params } = await initResponse.json();

  const formData = new FormData();
  Object.entries(upload_params || {}).forEach(([key, value]) => {
    if (value != null) formData.append(key, String(value));
  });
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  });

  const uploadResponse = await fetch(upload_url, { method: 'POST', body: formData });
  if (!uploadResponse.ok) {
    throw new Error(`Canvas respondió ${uploadResponse.status} subiendo el archivo.`);
  }
  const uploaded = await uploadResponse.json();
  return uploaded.id;
}

// Entrega una tarea subiendo un archivo (elegido con expo-document-picker en
// la pantalla). `file` es el asset que devuelve el picker: { uri, name, size, mimeType }.
export async function submitFile(courseId, assignmentId, file) {
  const fileId = await uploadSubmissionFile(courseId, assignmentId, file);
  return canvasFetch(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({
      submission: { submission_type: 'online_upload', file_ids: [fileId] },
    }),
  });
}
