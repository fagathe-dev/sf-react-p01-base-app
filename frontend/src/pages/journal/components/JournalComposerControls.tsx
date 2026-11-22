import { ColorDot } from '@/components/ColorDot';
import { FilterChip, FilterChipRow } from '@/components/FilterChip';
import { useGeolocation } from '@/hooks';
import { JournalLocation, JournalTag, MOOD_META, MoodEnum } from '@/types/journal.types';
import { Button, Dropdown, Icon, IconButton } from 'core-react/ui';
import React, { useEffect, useMemo, useRef } from 'react';
import { styled } from 'styled-components';

/* ------------------------------------------------------------------------------------------------
 * Humeur
 * ---------------------------------------------------------------------------------------------- */

// 15 humeurs : menu borné en hauteur, avec défilement
const MoodMenu = styled(Dropdown.Menu)`
  max-height: 18rem;
  overflow-y: auto;
`;

const Emoji = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  line-height: 1;
`;

export const JournalMoodPicker: React.FC<{ value: MoodEnum | null; onChange: (mood: MoodEnum | null) => void }> = ({
  value,
  onChange,
}) => (
  <Dropdown>
    <Dropdown.Trigger aria-label="Choisir une humeur">
      <Button type="button" $variant="ghost" $size="sm">
        {value ? <Emoji>{MOOD_META[value].emoji}</Emoji> : <Icon name="emoticon-happy-outline" size={18} />}
        {value ? MOOD_META[value].label : 'Humeur'}
      </Button>
    </Dropdown.Trigger>
    <MoodMenu align="left" minWidth="13rem">
      {(Object.keys(MOOD_META) as MoodEnum[]).map((mood) => (
        <Dropdown.Item key={mood} icon={<Emoji>{MOOD_META[mood].emoji}</Emoji>} onClick={() => onChange(mood)}>
          {MOOD_META[mood].label}
        </Dropdown.Item>
      ))}
      {value && (
        <>
          <Dropdown.Divider />
          <Dropdown.Item variant="danger" icon={<Icon name="close" size={16} />} onClick={() => onChange(null)}>
            Retirer l’humeur
          </Dropdown.Item>
        </>
      )}
    </MoodMenu>
  </Dropdown>
);

/* ------------------------------------------------------------------------------------------------
 * Localisation
 * ---------------------------------------------------------------------------------------------- */

export const JournalLocationButton: React.FC<{
  value: JournalLocation | null;
  onChange: (location: JournalLocation | null) => void;
}> = ({ value, onChange }) => {
  const { status, location, errorMessage, requestLocation, clearLocation } = useGeolocation(value);

  useEffect(() => {
    onChange(location);
  }, [location, onChange]);

  if (status === 'success' && location) {
    const label = [location.city, location.country].filter(Boolean).join(', ') || location.name;
    return (
      <Button type="button" $variant="ghost" $size="sm" onClick={clearLocation} title="Retirer la localisation">
        <Icon name="map-marker-outline" size={18} />
        {label}
        <Icon name="close" size={14} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      $variant="ghost"
      $size="sm"
      $loading={status === 'loading'}
      onClick={requestLocation}
      title={status === 'error' ? 'Réessayer' : 'Ajouter ma position'}
    >
      <Icon name="map-marker-outline" size={18} />
      {status === 'error' ? errorMessage : 'Lieu'}
    </Button>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Tags (sélection multiple)
 * ---------------------------------------------------------------------------------------------- */

export const JournalTagPicker: React.FC<{
  tags: JournalTag[];
  value: string[];
  onChange: (ids: string[]) => void;
}> = ({ tags, value, onChange }) => {
  if (tags.length === 0) return null;

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <FilterChipRow role="group" aria-label="Tags du post">
      {tags.map((tag) => (
        <FilterChip key={tag.id} aria-pressed={value.includes(tag.id)} onClick={() => toggle(tag.id)}>
          <ColorDot $color={tag.color} />
          {tag.name}
        </FilterChip>
      ))}
    </FilterChipRow>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Médias (sélection + miniatures avant publication)
 * ---------------------------------------------------------------------------------------------- */

const ACCEPTED_MEDIA = 'image/*,video/*,audio/*';

const HiddenInput = styled.input`
  display: none;
`;

const Thumbs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Thumb = styled.figure`
  position: relative;
  width: 5rem;
  height: 5rem;
  margin: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ThumbIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const RemoveThumb = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing[1]};
  right: ${({ theme }) => theme.spacing[1]};
`;

export const JournalMediaButton: React.FC<{ onAdd: (files: File[]) => void }> = ({ onAdd }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MEDIA}
        multiple
        onChange={(e) => {
          if (e.target.files) onAdd(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      <Button type="button" $variant="ghost" $size="sm" onClick={() => inputRef.current?.click()}>
        <Icon name="image-plus" size={18} />
        Média
      </Button>
    </>
  );
};

/** Miniatures des médias choisis ; les URL locales sont libérées au démontage. */
export const JournalMediaThumbs: React.FC<{ files: File[]; onRemove: (index: number) => void }> = ({ files, onRemove }) => {
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  if (files.length === 0) return null;

  return (
    <Thumbs>
      {previews.map(({ file, url }, index) => (
        <Thumb key={url}>
          {file.type.startsWith('image/') ? (
            <img src={url} alt={file.name} />
          ) : file.type.startsWith('video/') ? (
            <video src={url} muted />
          ) : (
            <ThumbIcon title={file.name}>
              <Icon name="file-music-outline" size={28} />
            </ThumbIcon>
          )}
          <RemoveThumb>
            <IconButton name="close" size="sm" variant="secondary" round aria-label={`Retirer ${file.name}`} onClick={() => onRemove(index)} />
          </RemoveThumb>
        </Thumb>
      ))}
    </Thumbs>
  );
};
