/**
 * Icône (nom MDI du Design System) correspondant à un fichier joint.
 *
 * Le type vient de `FileTypeEnum` (core-php) : 'Archive', 'Audio', 'Code', 'Image', 'PDF', 'Présentation',
 * 'Tableur', 'Traitement de texte', 'Texte', 'Vidéo'. S'il est absent, on se rabat sur le type MIME.
 * Seules des icônes présentes dans le kit sont utilisées (pas de `file-pdf`/`file-excel` dans le DS).
 */
const ICON_BY_TYPE: Record<string, string> = {
  Archive: 'archive-outline',
  Audio: 'file-music-outline',
  Code: 'file-code-outline',
  Image: 'image-outline',
  PDF: 'file-document-outline',
  Présentation: 'presentation',
  Tableur: 'table',
  'Traitement de texte': 'file-document-edit-outline',
  Texte: 'text-box-outline',
  Vidéo: 'file-video-outline',
};

const ICON_BY_MIME: Array<[RegExp, string]> = [
  [/^image\//, 'image-outline'],
  [/^video\//, 'file-video-outline'],
  [/^audio\//, 'file-music-outline'],
  [/pdf$/, 'file-document-outline'],
  [/zip|rar|7z|tar|gzip|compressed/, 'archive-outline'],
  [/spreadsheet|excel|csv/, 'table'],
  [/presentation|powerpoint/, 'presentation'],
  [/wordprocessing|msword|opendocument\.text/, 'file-document-edit-outline'],
  [/json|javascript|typescript|xml|x-php|x-python|x-sh/, 'file-code-outline'],
  [/^text\//, 'text-box-outline'],
];

export const DEFAULT_FILE_ICON = 'file-outline';

export const getFileIcon = (file: { type?: string | null; mimeType?: string | null }): string => {
  const byType = file.type ? ICON_BY_TYPE[file.type] : undefined;
  if (byType) {
    return byType;
  }

  const mime = file.mimeType?.toLowerCase() ?? '';
  return ICON_BY_MIME.find(([pattern]) => pattern.test(mime))?.[1] ?? DEFAULT_FILE_ICON;
};
