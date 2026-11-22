import { JournalBlockType } from '@/types/journal.types';
import { MarkdownEditor } from '@/ui/components';
import {
  createBlockRegistry,
  DEFAULT_GALLERY_BLOCK_DATA,
  DEFAULT_IMAGE_BLOCK_DATA,
  DEFAULT_QUOTE_BLOCK_DATA,
  DEFAULT_TEXT_BLOCK_DATA,
  DEFAULT_VIDEO_BLOCK_DATA,
  defineBlock,
  GalleryBlock,
  GalleryBlockView,
  ImageBlock,
  ImageBlockView,
  QuoteBlock,
  QuoteBlockView,
  type TextBlockData,
  type TextBlockProps,
  TextBlockView,
  VideoBlock,
  VideoBlockView,
} from 'core-react/editor';
import React from 'react';
import styled from 'styled-components';

const TransparentBlockMarkdown = styled.div`
  /* Conteneur du MarkdownEditor totalement transparent dans le bloc */
  & > div,
  & div:has(> div > [role='radiogroup']),
  & div:has(> [role='radiogroup']),
  & [role='radiogroup'],
  & textarea {
    background-color: transparent !important;
  }
`;

/**
 * Bloc Texte personnalisé : utilise MarkdownEditor de core-react avec fond transparent.
 */
export const JournalTextBlock: React.FC<TextBlockProps> = ({ data, onChange, ...rest }) => {
  const lineCount = (data.content || '').split('\n').length;
  const rows = Math.min(Math.max(lineCount + 2, 5), 20);

  return (
    <TransparentBlockMarkdown {...rest}>
      <MarkdownEditor
        aria-label="Contenu du bloc texte"
        placeholder="Rédigez votre paragraphe en Markdown…"
        hint="Markdown : ## Titre, **gras**, *italique*, ==surligné==, [lien](https://…), - liste"
        rows={rows}
        value={data.content || ''}
        onChange={(content) => onChange({ ...data, content })}
      />
    </TransparentBlockMarkdown>
  );
};

/**
 * Registre des 5 blocs de l'éditeur de pages du journal :
 * - Texte (MarkdownEditor transparent)
 * - Image
 * - Vidéo
 * - Galerie
 * - Citation
 */
export const JOURNAL_BLOCK_REGISTRY = createBlockRegistry<JournalBlockType>({
  text: defineBlock<TextBlockData>({
    type: 'text',
    label: 'Texte',
    icon: 'format-pilcrow',
    description: 'Paragraphes en Markdown',
    Editor: JournalTextBlock,
    View: TextBlockView,
    createData: () => ({ ...DEFAULT_TEXT_BLOCK_DATA }),
  }),
  image: defineBlock({
    type: 'image',
    label: 'Image',
    icon: 'image-outline',
    description: 'Image avec légende',
    Editor: ImageBlock,
    View: ImageBlockView,
    createData: () => ({ ...DEFAULT_IMAGE_BLOCK_DATA }),
  }),
  video: defineBlock({
    type: 'video',
    label: 'Vidéo',
    icon: 'video-outline',
    description: 'Fichier ou URL vidéo',
    Editor: VideoBlock,
    View: VideoBlockView,
    createData: () => ({ ...DEFAULT_VIDEO_BLOCK_DATA }),
  }),
  gallery: defineBlock({
    type: 'gallery',
    label: 'Galerie',
    icon: 'view-grid-outline',
    description: "Grille d'images",
    Editor: GalleryBlock,
    View: GalleryBlockView,
    createData: () => ({
      ...DEFAULT_GALLERY_BLOCK_DATA,
      images: [],
    }),
  }),
  quote: defineBlock({
    type: 'quote',
    label: 'Citation',
    icon: 'format-quote-close',
    description: 'Citation et auteur',
    Editor: QuoteBlock,
    View: QuoteBlockView,
    createData: () => ({ ...DEFAULT_QUOTE_BLOCK_DATA }),
  }),
});
