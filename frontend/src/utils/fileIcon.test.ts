import { describe, expect, it } from 'vitest';
import { DEFAULT_FILE_ICON, getFileIcon } from './fileIcon';

describe('getFileIcon', () => {
  it.each([
    ['PDF', 'file-document-outline'],
    ['Image', 'image-outline'],
    ['Tableur', 'table'],
    ['Présentation', 'presentation'],
    ['Traitement de texte', 'file-document-edit-outline'],
    ['Vidéo', 'file-video-outline'],
  ])('utilise le type %s', (type, icon) => {
    expect(getFileIcon({ type, mimeType: 'application/octet-stream' })).toBe(icon);
  });

  it.each([
    ['image/png', 'image-outline'],
    ['application/pdf', 'file-document-outline'],
    ['application/zip', 'archive-outline'],
    ['text/csv', 'table'],
    ['text/markdown', 'text-box-outline'],
  ])('se rabat sur le type MIME %s sans type', (mimeType, icon) => {
    expect(getFileIcon({ type: null, mimeType })).toBe(icon);
  });

  it('retourne l’icône par défaut si rien ne correspond', () => {
    expect(getFileIcon({ type: 'Inconnu', mimeType: 'application/octet-stream' })).toBe(DEFAULT_FILE_ICON);
    expect(getFileIcon({})).toBe(DEFAULT_FILE_ICON);
  });
});
