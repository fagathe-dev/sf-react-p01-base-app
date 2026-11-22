import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import {
  Avatar,
  Badge,
  Container,
  Flex,
  Icon,
  Navbar,
  NavbarDropdown,
  NavbarDropdownDivider,
  NavbarDropdownItem,
  NavbarDropdownMenu,
  NavbarDropdownToggle,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarToggle,
  Text,
  ThemeModeSwitcher,
} from 'core-react/ui';
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { styled } from 'styled-components';

const Root = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.body};
`;

const ContentArea = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
`;

const ScrollArea = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const Page = styled(Container)`
  max-width: 72rem;
  padding-top: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[7]};
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2.5]};
  color: ${({ theme }) => theme.colors.text.heading};
  text-decoration: none;
`;

const BrandMark = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const NavbarEnd = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-left: auto;
`;

const AccountToggle = styled(NavbarDropdownToggle)`
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.full};
`;

const AccountMenu = styled(NavbarDropdownMenu)`
  min-width: 18rem;
`;

const MenuPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Ellipsis = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface NavModule {
  label: string;
  path: string;
  icon: string;
}

const WORKSPACE_MODULES: NavModule[] = [
  { label: 'Tâches', path: '/todos', icon: 'format-list-checks' },
  { label: 'Journal', path: '/journal', icon: 'book-open-outline' },
];

const ADMIN_MODULES: NavModule[] = [
  { label: 'E-mails', path: '/admin/emails', icon: 'email-outline' },
  { label: 'Logs', path: '/admin/logs', icon: 'text-box-search-outline' },
];

const NavGroup: React.FC<{ title: string; modules: NavModule[]; isActive: (path: string) => boolean }> = ({
  title,
  modules,
  isActive,
}) => (
  <>
    <SidebarSection>{title}</SidebarSection>
    {modules.map(({ label, path, icon }) => {
      const active = isActive(path);
      return (
        <SidebarItem key={path}>
          <SidebarLink
            href={path}
            active={active}
            icon={<Icon name={icon} size={18} />}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </SidebarLink>
        </SidebarItem>
      );
    })}
  </>
);

export const AppLayout: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { isAdmin, roleLabel } = useAuth();
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const displayName = user?.username ?? 'Utilisateur';
  const roleBadge = (
    <Badge $variant={isAdmin ? 'primary' : 'neutral'} $pill>
      {roleLabel}
    </Badge>
  );

  return (
    <SidebarProvider breakpoint="md">
      <Root>
        <Sidebar width="16rem" breakpoint="md">
          <SidebarHeader>
            <Brand to="/todos">
              <BrandMark src="/images/logo.webp" alt="" />
              <Text $weight="semibold">Mon espace</Text>
            </Brand>
          </SidebarHeader>

          <SidebarNav>
            <NavGroup title="Espaces de travail" modules={WORKSPACE_MODULES} isActive={isActive} />
            {isAdmin && <NavGroup title="Administration" modules={ADMIN_MODULES} isActive={isActive} />}
          </SidebarNav>

          <SidebarFooter>
            <Flex $align="center" $gap="0.625rem">
              <Avatar name={displayName} src={user?.avatar ?? undefined} size="sm" />
              <UserMeta>
                <Ellipsis $size="sm" $weight="semibold">
                  {displayName}
                </Ellipsis>
                <Ellipsis $size="xs" $color="muted">
                  {user?.email ?? ''}
                </Ellipsis>
              </UserMeta>
            </Flex>
          </SidebarFooter>
        </Sidebar>

        <ContentArea>
          <Navbar sticky breakpoint="md">
            <SidebarToggle aria-label="Afficher le menu" />

            <NavbarEnd>
              <ThemeModeSwitcher size="sm" />
              <NavbarDropdown>
                <AccountToggle aria-label="Menu du compte">
                  <Avatar name={displayName} src={user?.avatar ?? undefined} size="sm" />
                </AccountToggle>

                <AccountMenu align="right">
                  <MenuPanel>
                    <Flex $align="center" $justify="space-between" $gap="0.75rem">
                      <UserMeta>
                        <Ellipsis $size="sm" $weight="semibold">
                          {displayName}
                        </Ellipsis>
                        <Ellipsis $size="xs" $color="muted">
                          {user?.email ?? ''}
                        </Ellipsis>
                      </UserMeta>
                      {roleBadge}
                    </Flex>
                  </MenuPanel>

                  <NavbarDropdownDivider />
                  <NavbarDropdownItem href="/profile">
                    <Flex $align="center" $gap="0.5rem">
                      <Icon name="account-outline" size={18} />
                      Mon profil
                    </Flex>
                  </NavbarDropdownItem>
                  <NavbarDropdownDivider />

                  <NavbarDropdownItem href="/logout">
                    <Flex $align="center" $gap="0.5rem">
                      <Icon name="logout" size={18} />
                      Se déconnecter
                    </Flex>
                  </NavbarDropdownItem>
                </AccountMenu>
              </NavbarDropdown>
            </NavbarEnd>
          </Navbar>

          <ScrollArea>
            <Page $fluid>
              <Outlet />
            </Page>
          </ScrollArea>
        </ContentArea>
      </Root>
    </SidebarProvider>
  );
};
