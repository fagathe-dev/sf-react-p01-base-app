import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  ConfirmEmailChangePage,
  EmailPreviewPage,
  ForgotPasswordPage,
  JournalCreatePage,
  JournalDetailsPage,
  JournalEditPage,
  JournalsPage,
  LoginPage,
  LogoutPage,
  LogsPage,
  NotesArchivePage,
  NotesPage,
  NotesTrashPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  TagsPage,
  TodoPage,
  VerifyEmailPage,
} from '@/pages';
import { AdminRoute } from '@/router/adminRoute';
import { ProtectedRoute } from '@/router/protectedRoute';
import { PublicRoute } from '@/router/publicRoute';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  // 1. Espace connecté (Sidebar Dashboard via AppLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/logout',
        element: <LogoutPage />, // <-- 2. Branchement sur la route /logout
      },
      {
        element: <AppLayout />,
        children: [
          // Redirection racine vers les todos
          {
            path: '/',
            element: <Navigate to="/todos" replace />,
          },

          // Module Todos
          {
            path: '/todos',
            element: <TodoPage />,
          },

          // Module Tags
          {
            path: '/tags',
            element: <TagsPage />,
          },

          // Module Notes
          {
            path: '/notes',
            element: <NotesPage />,
          },
          {
            path: '/archives',
            element: <NotesArchivePage />,
          },
          {
            path: '/trash',
            element: <NotesTrashPage />,
          },

          // Module Journal intime
          {
            path: '/journal',
            children: [
              { index: true, element: <JournalsPage /> },
              { path: 'new', element: <JournalCreatePage /> },
              { path: ':journalId', element: <JournalDetailsPage /> },
              { path: ':journalId/edit', element: <JournalEditPage /> },
            ],
          },

          // Gestion du compte & profil
          {
            path: '/profile',
            element: <ProfilePage />,
          },

          // Administration (ROLE_ADMIN)
          {
            path: '/admin',
            element: <AdminRoute />,
            children: [
              { index: true, element: <Navigate to="/admin/emails" replace /> },
              { path: 'emails', element: <EmailPreviewPage /> },
              { path: 'logs', element: <LogsPage /> },
            ],
          },
        ],
      },
    ],
  },

  // 2. Espace public (Connexion & Inscription)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
        ],
      },
    ],
  },

  // 3. Liens reçus par e-mail : accessibles connecté ou non (le jeton fait foi)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/confirm-email-change',
        element: <ConfirmEmailChangePage />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // 4. Fallback 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
