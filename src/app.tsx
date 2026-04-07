import { createBrowserRouter, Navigate } from 'react-router'
import { Shell } from '@/components/layout/Shell'
import { SetupPage } from '@/pages/SetupPage'
import { ControllerPage } from '@/pages/ControllerPage'
import { ViewerPage } from '@/pages/ViewerPage'
import { IntercomPage } from '@/pages/IntercomPage'
import { MultiviewerPage } from '@/pages/MultiviewerPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/setup" replace /> },
      { path: 'setup/*', element: <SetupPage /> },
      { path: 'controller', element: <ControllerPage /> },
      { path: 'viewer', element: <ViewerPage /> },
      { path: 'intercom', element: <IntercomPage /> },
      { path: 'multiviewer', element: <MultiviewerPage /> },
    ],
  },
])
