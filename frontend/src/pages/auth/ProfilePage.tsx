import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { useJournalStore } from '@/stores/journal.store';
import { Badge, Card, Flex, Icon, TabContent, TabList, Tabs, TabTrigger, Text, Title } from 'core-react/ui';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from 'styled-components';
import {
  ChangeAvatarForm,
  ChangeEmailForm,
  ChangeInformationsForm,
  ChangeJournalPasscodeForm,
  ChangePasswordForm,
  DeleteAccountCard,
  JournalLockCard,
  ProfileSkeleton,
} from './components';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  max-width: 48rem;
`;

const Summary = styled(Card.Body)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]};
`;

const Name = styled(Title)`
  margin-bottom: 0;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  padding-top: ${({ theme }) => theme.spacing[5]};
`;

const PROFILE_TABS = ['informations', 'security', 'journal', 'danger'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { isAdmin, roleLabel } = useAuth();
  const loadSecurity = useJournalStore((state) => state.loadSecurity);
  // Onglet porté par l'URL : /profile?tab=journal (lien depuis le bandeau de l'onglet Privé)
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = PROFILE_TABS.includes(searchParams.get('tab') as ProfileTab) ? (searchParams.get('tab') as ProfileTab) : 'informations';

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  if (!user) return <ProfileSkeleton />;

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');

  return (
    <>
      <PageHeader title="Mon profil" description="Vos informations, la sécurité de votre compte et vos préférences." icon="account-outline" />

      <Content>
        <Card>
          <Summary>
            <ChangeAvatarForm />
            <Flex $direction="column" $gap="0.25rem">
              <Flex $align="center" $gap="0.625rem" $wrap="wrap">
                <Name as="h2">{fullName || user.username}</Name>
                <Badge $variant={isAdmin ? 'primary' : 'neutral'} $pill>
                  {roleLabel}
                </Badge>
              </Flex>
              <Text $size="sm" $color="muted">
                @{user.username} · {user.email}
              </Text>
            </Flex>
          </Summary>
        </Card>

        <Tabs value={tab} onValueChange={(value) => setSearchParams(value === 'informations' ? {} : { tab: value }, { replace: true })}>
          <TabList>
            <TabTrigger value="informations">
              <Icon name="account-outline" size={16} />
              <span>Informations</span>
            </TabTrigger>
            <TabTrigger value="security">
              <Icon name="shield-lock-outline" size={16} />
              <span>Sécurité</span>
            </TabTrigger>
            <TabTrigger value="journal">
              <Icon name="book-lock-outline" size={16} />
              <span>Journal</span>
            </TabTrigger>
            <TabTrigger value="danger">
              <Icon name="alert-octagon-outline" size={16} />
              <span>Zone de danger</span>
            </TabTrigger>
          </TabList>

          <TabContent value="informations">
            <Panel>
              <ChangeInformationsForm />
            </Panel>
          </TabContent>

          <TabContent value="security">
            <Panel>
              <ChangeEmailForm />
              <ChangePasswordForm />
            </Panel>
          </TabContent>

          <TabContent value="journal">
            <Panel>
              <JournalLockCard />
              <ChangeJournalPasscodeForm />
            </Panel>
          </TabContent>

          <TabContent value="danger">
            <Panel>
              <DeleteAccountCard />
            </Panel>
          </TabContent>
        </Tabs>
      </Content>
    </>
  );
};
