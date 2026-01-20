import { redirect } from 'next/navigation'

// Redireciona /admin para /admin/dashboard
export default function AdminPage() {
  redirect('/admin/dashboard')
}
