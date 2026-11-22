import { TagBadge } from '@/components/TagBadge';
import { deleteJournalPost, toggleJournalPostFlag, updateJournalPost } from '@/services/journal.api';
import { useAuthStore } from '@/stores/auth.store';
import { JournalPost, JournalTag, MOOD_META } from '@/types/journal.types';
import { formatFullDate, formatRelativeDate, formatYearsAgo } from '@/utils/journal';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  Flex,
  Icon,
  IconButton,
  MarkdownEditor,
  MarkdownViewer,
  Modal,
  Text,
  Tooltip,
  useToast,
} from 'core-react/ui';
import React, { useState } from 'react';
import { styled } from 'styled-components';
import { JournalComposer } from './JournalComposer';
import { JournalLockScreen } from './JournalLockScreen';
import { JournalMediaGallery } from './JournalMediaGallery';

// overflow visible : le menu « … » ne doit pas être coupé par la Card du kit
const PostCard = styled(Card)<{ $pinned: boolean }>`
  overflow: visible;
  border-color: ${({ $pinned, theme }) => ($pinned ? theme.colors.primary.base : theme.colors.border.default)};
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
`;

const Content = styled.div`
  color: ${({ theme }) => theme.colors.text.body};
  overflow-wrap: anywhere;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/** Fil des suites : un filet vertical relie le post initial à ses mises à jour. */
const Thread = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  margin: 0;
  padding: ${({ theme }) => `0 0 0 ${theme.spacing[5]}`};
  list-style: none;
  border-left: 2px solid ${({ theme }) => theme.colors.primary.subtle};
`;

const ThreadItem = styled.li`
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: ${({ theme }) => theme.spacing[1.5]};
    left: calc(-${({ theme }) => theme.spacing[5]} - 6px);
    width: 10px;
    height: 10px;
    border: 2px solid ${({ theme }) => theme.colors.background.surface};
    border-radius: ${({ theme }) => theme.radii.full};
    background-color: ${({ theme }) => theme.colors.primary.base};
  }
`;

const Footer = styled(Card.Footer)`
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Time: React.FC<{ iso: string }> = ({ iso }) => (
  <Tooltip content={formatFullDate(iso)}>
    <Text as="time" dateTime={iso} $size="xs" $color="muted" tabIndex={0}>
      {formatRelativeDate(iso)}
    </Text>
  </Tooltip>
);

/** Contenu d'un post ou d'une suite : texte Markdown (ou éditeur en ligne) puis médias. */
const PostBody: React.FC<{
  post: JournalPost;
  editing: boolean;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}> = ({ post, editing, onSave, onCancel }) => {
  const [draft, setDraft] = useState(post.content);
  const [saving, setSaving] = useState(false);

  if (editing) {
    const save = async () => {
      setSaving(true);
      try {
        await onSave(draft.trim());
      } finally {
        setSaving(false);
      }
    };

    return (
      <Stack
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            save();
          }
        }}
      >
        <MarkdownEditor aria-label="Modifier le post" value={draft} onChange={setDraft} rows={4} autoFocus />
        <Flex $justify="flex-end" $gap="0.5rem">
          <Button type="button" $variant="ghost" $size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" $size="sm" $loading={saving} disabled={!draft.trim() && post.medias.length === 0} onClick={save}>
            Enregistrer
          </Button>
        </Flex>
      </Stack>
    );
  }

  return (
    <Stack>
      {post.content && (
        <Content>
          <MarkdownViewer allowImages breaks linkTarget="_blank">
            {post.content}
          </MarkdownViewer>
        </Content>
      )}
      <JournalMediaGallery medias={post.medias} />
    </Stack>
  );
};

interface JournalPostCardProps {
  post: JournalPost;
  /** Tags du journal, pour le composer des suites */
  tags: JournalTag[];
  /** Contenu privé accessible (protection inactive ou journal déverrouillé) ; sinon le code est demandé avant de verrouiller / déverrouiller un post */
  isUnlocked: boolean;
  /** Onglet Souvenirs : affiche « Il y a N ans » */
  showYearsAgo?: boolean;
  onChange: (root: JournalPost) => void;
  onDelete: (id: string) => void;
}

/**
 * Carte d'un post racine : en-tête (auteur, date, humeur, lieu), contenu Markdown, médias, actions,
 * puis le fil des suites avec un composer en ligne.
 */
export const JournalPostCard: React.FC<JournalPostCardProps> = ({ post, tags, isUnlocked, showYearsAgo, onChange, onDelete }) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const [toDelete, setToDelete] = useState<JournalPost | null>(null);
  const [askUnlock, setAskUnlock] = useState(false);

  const notifyError = (err: unknown, fallback: string) =>
    toast({ message: err instanceof Error ? err.message : fallback, variant: 'danger' });

  const runToggle = async (flag: 'bookmark' | 'pin' | 'toggle-private') => {
    try {
      onChange(await toggleJournalPostFlag(post.id, flag));
    } catch (err) {
      notifyError(err, 'Action impossible.');
    }
  };

  /** Verrouiller (privé) / déverrouiller (public) le post ; demande d'abord le code si la protection l'exige. */
  const togglePrivate = () => {
    if (isUnlocked) {
      runToggle('toggle-private');
    } else {
      setAskUnlock(true);
    }
  };

  const saveContent = (target: JournalPost) => async (content: string) => {
    try {
      onChange(await updateJournalPost(target.id, { content }));
      setEditingId(null);
    } catch (err) {
      notifyError(err, 'Erreur lors de la modification.');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteJournalPost(toDelete.id);
      if (toDelete.id === post.id) {
        onDelete(post.id);
      } else {
        onChange({ ...post, replies: (post.replies ?? []).filter((r) => r.id !== toDelete.id) });
      }
    } catch (err) {
      notifyError(err, 'Erreur lors de la suppression.');
    } finally {
      setToDelete(null);
    }
  };

  const replies = post.replies ?? [];
  const mood = post.mood ? MOOD_META[post.mood] : null;

  return (
    <PostCard as="article" $pinned={post.is_pinned} aria-label={`Post du ${formatFullDate(post.created_at)}`}>
      <Card.Body>
        <Stack>
          <Header>
            <Flex $align="center" $gap="0.75rem">
              <Avatar name={user?.username ?? 'Moi'} src={user?.avatar ?? undefined} size="base" />
              <div>
                <Text $size="sm" $weight="semibold">
                  {user?.username ?? 'Moi'}
                </Text>
                <Meta>
                  {showYearsAgo && (
                    <Badge $variant="warning" $pill>
                      {formatYearsAgo(post.created_at)}
                    </Badge>
                  )}
                  <Time iso={post.created_at} />
                  {mood && (
                    <Badge $variant="neutral" $pill>
                      {mood.emoji} {mood.label}
                    </Badge>
                  )}
                  {post.location && (
                    <Badge $variant="info" $pill>
                      <Icon name="map-marker-outline" size={12} /> {post.location.city ?? post.location.name}
                    </Badge>
                  )}
                  {post.is_private && (
                    <Badge $variant="primary" $pill>
                      <Icon name="lock-outline" size={12} /> Privé
                    </Badge>
                  )}
                  {post.is_pinned && (
                    <Badge $variant="secondary" $pill>
                      <Icon name="pin" size={12} /> Épinglé
                    </Badge>
                  )}
                </Meta>
              </div>
            </Flex>

            <Dropdown>
              <Dropdown.Trigger>
                <IconButton name="dots-horizontal" variant="ghost" size="sm" aria-label="Actions du post" />
              </Dropdown.Trigger>
              <Dropdown.Menu align="right" minWidth="13rem">
                <Dropdown.Item icon={<Icon name="pencil-outline" size={16} />} onClick={() => setEditingId(post.id)}>
                  Modifier
                </Dropdown.Item>
                <Dropdown.Item icon={<Icon name={post.is_private ? 'eye-outline' : 'lock-outline'} size={16} />} onClick={togglePrivate}>
                  {post.is_private ? 'Déverrouiller (rendre public)' : 'Verrouiller (rendre privé)'}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item variant="danger" icon={<Icon name="trash-can-outline" size={16} />} onClick={() => setToDelete(post)}>
                  Supprimer
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Header>

          <PostBody
            key={`${post.id}-${post.updated_at ?? ''}`}
            post={post}
            editing={editingId === post.id}
            onSave={saveContent(post)}
            onCancel={() => setEditingId(null)}
          />

          {post.tags.length > 0 && (
            <Flex $wrap="wrap" $gap="0.375rem">
              {post.tags.map((tag) => (
                <TagBadge key={tag.id} color={tag.color}>
                  {tag.name}
                </TagBadge>
              ))}
            </Flex>
          )}

          {replies.length > 0 && (
            <Thread aria-label="Suites du post">
              {replies.map((reply) => (
                <ThreadItem key={reply.id}>
                  <Stack>
                    <Flex $align="center" $justify="space-between" $gap="0.5rem">
                      <Meta>
                        <Text $size="xs" $weight="semibold" $color="primary">
                          Mise à jour
                        </Text>
                        <Time iso={reply.created_at} />
                        {reply.mood && (
                          <Text $size="xs">
                            {MOOD_META[reply.mood].emoji} {MOOD_META[reply.mood].label}
                          </Text>
                        )}
                      </Meta>
                      <Flex $gap="0.125rem">
                        <IconButton name="pencil-outline" variant="ghost" size="sm" aria-label="Modifier la suite" onClick={() => setEditingId(reply.id)} />
                        <IconButton name="trash-can-outline" variant="ghost" size="sm" aria-label="Supprimer la suite" onClick={() => setToDelete(reply)} />
                      </Flex>
                    </Flex>
                    <PostBody
                      key={`${reply.id}-${reply.updated_at ?? ''}`}
                      post={reply}
                      editing={editingId === reply.id}
                      onSave={saveContent(reply)}
                      onCancel={() => setEditingId(null)}
                    />
                  </Stack>
                </ThreadItem>
              ))}
            </Thread>
          )}

          {replying && (
            <JournalComposer
              tags={tags}
              parentId={post.id}
              onPublished={(root) => {
                onChange(root);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </Stack>
      </Card.Body>

      <Footer>
        <Button type="button" $variant="ghost" $size="sm" onClick={() => setReplying(true)} disabled={replying}>
          <Icon name="plus" size={16} />
          Ajouter une suite
        </Button>
        <Flex $gap="0.25rem">
          <IconButton
            name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
            variant={post.is_bookmarked ? 'secondary' : 'ghost'}
            size="sm"
            aria-label={post.is_bookmarked ? 'Retirer des enregistrés' : 'Enregistrer'}
            aria-pressed={post.is_bookmarked}
            onClick={() => runToggle('bookmark')}
          />
          <IconButton
            name={post.is_pinned ? 'pin' : 'pin-outline'}
            variant={post.is_pinned ? 'secondary' : 'ghost'}
            size="sm"
            aria-label={post.is_pinned ? 'Désépingler' : 'Épingler'}
            aria-pressed={post.is_pinned}
            onClick={() => runToggle('pin')}
          />
          <IconButton
            name={post.is_private ? 'lock' : 'lock-outline'}
            variant={post.is_private ? 'secondary' : 'ghost'}
            size="sm"
            aria-label={post.is_private ? 'Déverrouiller : rendre le post public' : 'Verrouiller : rendre le post privé'}
            aria-pressed={post.is_private}
            onClick={togglePrivate}
          />
        </Flex>
      </Footer>

      <Modal isOpen={askUnlock} onClose={() => setAskUnlock(false)} maxWidth="28rem">
        <Modal.Header title={post.is_private ? 'Déverrouiller ce post' : 'Verrouiller ce post'} onClose={() => setAskUnlock(false)} />
        <Modal.Body>
          <JournalLockScreen
            onUnlocked={() => {
              setAskUnlock(false);
              runToggle('toggle-private');
            }}
          />
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={toDelete && toDelete.id !== post.id ? 'Supprimer cette suite ?' : 'Supprimer ce post ?'}
        message={
          toDelete && toDelete.id !== post.id
            ? 'La suite et ses médias seront supprimés définitivement.'
            : 'Le post, ses suites et ses médias seront supprimés définitivement.'
        }
        confirmLabel="Supprimer"
      />
    </PostCard>
  );
};
