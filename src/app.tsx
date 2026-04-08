import { createBrowserRouter, Navigate } from 'react-router'
import { Shell } from '@/components/layout/Shell'
import { SetupPage } from '@/pages/SetupPage'
import { ControllerPage } from '@/pages/ControllerPage'
import { TallyPage } from '@/pages/TallyPage'

export const router = createBrowserRouter([
  {
    // Tally page is standalone — no Shell wrapper, no auth required
    path: '/tally',
    element: <TallyPage />,
  },
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/setup" replace /> },
      { path: 'setup/*', element: <SetupPage /> },
      { path: 'controller', element: <ControllerPage /> },
    ],
  },
])
