import { PageHeader } from '@/components/PageHeader';
import { useJournalAutoLock } from '@/hooks/useJournalAutoLock';
import { fetchJournalCounts, fetchJournalPosts, fetchJournalTags } from '@/services/journal.api';
import { selectCanSeePrivate, selectLockActive, useJournalStore } from '@/stores/journal.store';
import { JournalCounts, JournalPost, JournalPostTab, JournalTab, JournalTag } from '@/types/journal.types';
import { parseJournalTab } from '@/utils/journal';
import { Alert, Button, Flex, Icon, Link, SegmentedControl, Text, useToast } from 'core-react/ui';
import { useDebouncedValue } from 'core-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from 'styled-components';
import {
  JournalComposer,
  JournalFilterBar,
  JournalLockScreen,
  JournalPostList,
  JournalPostListSkeleton,
  JournalTagManager,
} from './components';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  max-width: 46rem;
`;

const TabsBar = styled.div`
  overflow-x: auto;
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

const EMPTY_STATES: Record<JournalPostTab, { icon: string; title: string; description?: string }> = {
  feed: { icon: 'feather', title: 'Votre fil est vide', description: 'Publiez votre premier post avec l’éditeur ci-dessus.' },
  memories: { icon: 'history', title: 'Aucun souvenir aujourd’hui', description: 'Les posts publiés un même jour les années précédentes apparaîtront ici.' },
  bookmarks: { icon: 'bookmark-outline', title: 'Aucun post enregistré', description: 'Enregistrez un post pour le retrouver ici.' },
  private: { icon: 'lock-outline', title: 'Aucun post privé', description: 'Les posts publiés ici ne sont visibles qu’avec votre code secret.' },
};

const tabLabel = (label: string, count?: number) => (count ? `${label} (${count})` : label);

/**
 * Journal : réseau social personnel. Feed, Souvenirs, Enregistrés et Tags s'affichent sans code ;
 * l'onglet Privé demande le code secret et se reverrouille seul après 90 s hors focus.
 */
export const JournalPage: React.FC = () => {
  useJournalAutoLock();
  const isUnlocked = useJournalStore((state) => state.isUnlocked);
  const lock = useJournalStore((state) => state.lock);
  const security = useJournalStore((state) => state.security);
  const loadSecurity = useJournalStore((state) => state.loadSecurity);
  // Protection effective seulement si un code est défini ET la protection activée (profil)
  const lockActive = useJournalStore(selectLockActive);
  const canSeePrivate = useJournalStore(selectCanSeePrivate);
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const tab: JournalTab = parseJournalTab(searchParams.get('tab'));
  const tagSlug = searchParams.get('tag');

  const [tags, setTags] = useState<JournalTag[]>([]);
  const [counts, setCounts] = useState<JournalCounts>({});
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const isPostTab = tab !== 'tags';
  const needsUnlock = tab === 'private' && !canSeePrivate;

  const updateParams = (next: { tab?: JournalTab; tag?: string | null }) => {
    const params = new URLSearchParams(searchParams);
    if (next.tab !== undefined) {
      if (next.tab === 'feed') params.delete('tab');
      else params.set('tab', next.tab);
    }
    if (next.tag !== undefined) {
      if (next.tag) params.set('tag', next.tag);
      else params.delete('tag');
    }
    setSearchParams(params, { replace: true });
  };

  const changeTab = (next: JournalTab) => {
    if (next === tab) return;
    setLoading(next !== 'tags');
    setPosts([]);
    updateParams({ tab: next });
  };

  const changeTag = (slug: string | null) => {
    setLoading(true);
    updateParams({ tag: slug });
  };

  // Tags et compteurs : rechargés au déverrouillage (ils incluent alors le privé) et après chaque modification
  const refreshMeta = useCallback(() => {
    fetchJournalTags().then(setTags).catch(() => setTags([]));
    fetchJournalCounts().then(setCounts).catch(() => setCounts({}));
  }, []);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta, canSeePrivate]);

  useEffect(() => {
    if (!isPostTab || needsUnlock) return;
    let cancelled = false;
    fetchJournalPosts(tab as JournalPostTab, { tag: tagSlug, q: debouncedSearch })
      .then((data) => !cancelled && setPosts(data))
      .catch((err) => !cancelled && toast({ message: err instanceof Error ? err.message : 'Impossible de charger le journal.', variant: 'danger' }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, tagSlug, debouncedSearch, isPostTab, needsUnlock, toast]);

  /** Une mutation renvoie le post racine complet : il remplace la carte, ou en sort s'il change d'onglet. */
  const handleChange = (root: JournalPost) => {
    const stillVisible =
      tab === 'private' ? root.is_private : !root.is_private && (tab !== 'bookmarks' || root.is_bookmarked);
    setPosts((prev) =>
      stillVisible ? prev.map((p) => (p.id === root.id ? root : p)) : prev.filter((p) => p.id !== root.id)
    );
    refreshMeta();
  };

  const handlePublished = (post: JournalPost) => {
    setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
    refreshMeta();
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    refreshMeta();
  };

  const tabOptions: Array<{ value: JournalTab; label: string; icon: string }> = [
    { value: 'feed', label: 'Feed', icon: 'home' },
    { value: 'memories', label: tabLabel('Souvenirs', counts.memories), icon: 'history' },
    { value: 'bookmarks', label: tabLabel('Enregistrés', counts.bookmarks), icon: 'bookmark-outline' },
    { value: 'tags', label: 'Tags', icon: 'tag-outline' },
    { value: 'private', label: 'Privé', icon: lockActive && !isUnlocked ? 'lock' : 'lock-outline' },
  ];

  const listProps = {
    tags,
    isUnlocked: canSeePrivate,
    onChange: handleChange,
    onDelete: handleDelete,
  };

  return (
    <>
      <PageHeader
        title="Journal"
        description="Votre fil personnel : pensées, souvenirs et mises à jour."
        icon="book-open-outline"
        actions={
          lockActive &&
          isUnlocked && (
            <Button type="button" $variant="outline" $size="sm" onClick={lock}>
              <Icon name="lock-outline" size={16} />
              Verrouiller
            </Button>
          )
        }
      />

      <TabsBar>
        <SegmentedControl aria-label="Onglets du journal" options={tabOptions} value={tab} onChange={changeTab} />
      </TabsBar>

      <Content>
        {tab === 'tags' ? (
          <JournalTagManager tags={tags} onChanged={refreshMeta} onPreview={(slug) => updateParams({ tab: 'feed', tag: slug })} />
        ) : needsUnlock ? (
          <JournalLockScreen />
        ) : (
          <>
            {tab === 'private' && security && !security.lockActive && (
              <Alert variant="warning" title={security.hasPasscode ? 'Protection désactivée' : 'Aucun code secret'}>
                {security.hasPasscode
                  ? 'Vos posts privés sont accessibles sans code. '
                  : 'Configurez un code secret pour que vos posts privés ne soient visibles qu’après déverrouillage. '}
                <Link href="/profile?tab=journal">
                  {security.hasPasscode ? 'Réactiver la protection' : 'Configurer le code secret'}
                </Link>
              </Alert>
            )}

            {tab === 'memories' && (
              <Text $size="sm" $color="muted">
                Ce jour-là, les années précédentes.
              </Text>
            )}

            {(tab === 'feed' || tab === 'private') && (
              <JournalComposer tags={tags} isPrivate={tab === 'private'} onPublished={handlePublished} />
            )}

            {tab !== 'memories' && (
              <JournalFilterBar tags={tags} activeSlug={tagSlug} onTagChange={changeTag} search={search} onSearchChange={setSearch} />
            )}

            {loading ? (
              <JournalPostListSkeleton />
            ) : (
              <Flex $direction="column">
                <JournalPostList posts={posts} empty={EMPTY_STATES[tab]} showYearsAgo={tab === 'memories'} {...listProps} />
              </Flex>
            )}
          </>
        )}
      </Content>
    </>
  );
};
