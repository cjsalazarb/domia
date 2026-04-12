import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRedirect } from '@/components/RoleRedirect'

import Login from '@/pages/auth/Login'
import SinAcceso from '@/pages/auth/SinAcceso'

import MisCondominios from '@/pages/admin/MisCondominios'
import Condominios from '@/pages/admin/Condominios'
import CondominioDashboard from '@/pages/admin/condominio/Dashboard'
import Residentes from '@/pages/admin/condominio/Residentes'
import Financiero from '@/pages/admin/condominio/Financiero'
import Mantenimiento from '@/pages/admin/condominio/Mantenimiento'
import Reservas from '@/pages/admin/condominio/Reservas'
import Comunicaciones from '@/pages/admin/condominio/Comunicaciones'
import GuardiasAdmin from '@/pages/admin/Guardias'

import PortalDashboard from '@/pages/portal/PortalDashboard'
import PortalRecibos from '@/pages/portal/PortalRecibos'
import PagarCuota from '@/pages/portal/PagarCuota'
import SolicitarMantenimiento from '@/pages/portal/SolicitarMantenimiento'
import ReservarArea from '@/pages/portal/ReservarArea'
import Comunicados from '@/pages/portal/Comunicados'
import MisDatos from '@/pages/portal/MisDatos'

import TurnoDashboard from '@/pages/guardia/TurnoDashboard'

export const router = createBrowserRouter([
  // Públicas
  { path: '/login', element: <Login /> },
  { path: '/sin-acceso', element: <SinAcceso /> },

  // Raíz — redirige según rol
  { path: '/', element: <RoleRedirect /> },

  // Admin — pantalla de selección de condominios
  {
    path: '/admin',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin']}>
        <MisCondominios />
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

  // Condominio — dashboard y módulos
  {
    path: '/admin/condominio/:id/dashboard',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <CondominioDashboard />
      </ProtectedRoute>
    ),
  },
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
  {
    path: '/admin/condominio/:id/guardias',
    element: (
      <ProtectedRoute rolesPermitidos={['super_admin', 'admin_condominio']}>
        <GuardiasAdmin />
      </ProtectedRoute>
    ),
  },

  // Portal residente
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
    path: '/portal/pagar',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <PagarCuota />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/mantenimiento',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <SolicitarMantenimiento />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/reservas',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <ReservarArea />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/comunicados',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <Comunicados />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portal/mis-datos',
    element: (
      <ProtectedRoute rolesPermitidos={['propietario', 'inquilino']}>
        <MisDatos />
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
