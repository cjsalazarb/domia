import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRedirect } from '@/components/RoleRedirect'

import Login from '@/pages/auth/Login'
import SinAcceso from '@/pages/auth/SinAcceso'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import Condominios from '@/pages/admin/Condominios'
import Residentes from '@/pages/admin/condominio/Residentes'
import Financiero from '@/pages/admin/condominio/Financiero'
import Mantenimiento from '@/pages/admin/condominio/Mantenimiento'
import Reservas from '@/pages/admin/condominio/Reservas'
import Comunicaciones from '@/pages/admin/condominio/Comunicaciones'

import PortalDashboard from '@/pages/portal/PortalDashboard'
import PortalRecibos from '@/pages/portal/PortalRecibos'
import PortalMantenimiento from '@/pages/portal/PortalMantenimiento'

import TurnoDashboard from '@/pages/guardia/TurnoDashboard'

export const router = createBrowserRouter([
  // Públicas
  { path: '/login', element: <Login /> },
  { path: '/sin-acceso', element: <SinAcceso /> },

  // Raíz — redirige según rol
  { path: '/', element: <RoleRedirect /> },

  // Admin — super_admin
  {
    path: '/admin',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/condominios',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin']}>
        <Condominios />
      </ProtectedRoute>
    ),
  },

  // Condominio — super_admin + admin_condominio
  {
    path: '/admin/condominio/:id/residentes',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <Residentes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/condominio/:id/financiero',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <Financiero />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/condominio/:id/mantenimiento',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <Mantenimiento />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/condominio/:id/reservas',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <Reservas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/condominio/:id/comunicaciones',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <Comunicaciones />
      </ProtectedRoute>
    ),
  },

  // Portal residente — propietario + inquilino
  {
    path: '/portal',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <PortalDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/recibos',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <PortalRecibos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/mantenimiento',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <PortalMantenimiento />
      </ProtectedRoute>
    ),
  },

  // Guardia
  {
    path: '/turno',
    element: (
      <ProtectedRoute rolesPermitidos={['guardia']}>
        <TurnoDashboard />
      </ProtectedRoute>
    ),
  },
])
