// ADMIN panel rendering. Pure functions only: no I/O, no client-supplied identity,
// and every list is derived from the authenticated principal's organization.
import {ROLES} from './domain.mjs';

// HTML-escape untrusted data. Assistant names/instructions are operator input and
// must never be able to break out of the surrounding markup or inject script.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function listTenantAssistants(assistants, principal) {
  if (!principal || !principal.organizationId || !principal.role) throw new Error('UNAUTHENTICATED');
  // Route guard lives here as well as in the HTTP layer so no caller can render
  // the panel for a non-admin principal.
  if (principal.role !== ROLES.ADMIN) throw new Error('FORBIDDEN');
  return assistants
    .filter((row) => row.organizationId === principal.organizationId)
    .map((row) => ({id: row.id, name: row.name, instructions: row.instructions ?? ''}));
}

export function renderAdminPanel({principal, assistants = []}) {
  const rows = listTenantAssistants(assistants, principal);
  const items = rows.length
    ? rows
        .map(
          (row) =>
            `      <li data-assistant-id="${escapeHtml(row.id)}"><strong>${escapeHtml(row.name)}</strong>` +
            `<pre>${escapeHtml(row.instructions)}</pre></li>`
        )
        .join('\n')
    : '      <li>Sin asistentes todavía.</li>';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>LeveIA · Panel ADMIN</title>
</head>
<body>
  <h1>Panel ADMIN</h1>
  <p>Organización: <span data-organization>${escapeHtml(principal.organizationId)}</span></p>
  <p>Usuario: <span data-user>${escapeHtml(principal.userId)}</span></p>
  <h2>Asistentes</h2>
  <ul data-assistants>
${items}
  </ul>
  <p>Acciones de escritura requieren el formulario autenticado (pendiente: protección CSRF).</p>
</body>
</html>`;
}
