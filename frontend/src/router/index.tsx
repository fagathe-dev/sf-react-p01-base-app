import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  ConfirmEmailChangePage,
  EmailPreviewPage,
  ForgotPasswordPage,
  JournalPage,
  LoginPage,
  LogoutPage,
  LogsPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
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
            // Les tags sont gérés dans l'onglet « Tags » de la page Tâches
            path: '/tags',
            element: <Navigate to="/todos?tab=tags" replace />,
          },

          // Module Journal (onglet courant dans ?tab=feed|memories|bookmarks|tags|private)
          {
            path: '/journal',
            element: <JournalPage />,
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
