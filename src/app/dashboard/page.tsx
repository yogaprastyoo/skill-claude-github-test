'use client'

import { useLogout, useUser } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: user } = useUser()
  const { mutate: logout, isPending } = useLogout()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            {user && (
              <p className="text-muted-foreground text-sm mt-1">
                Welcome back, {user.name}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => logout()} disabled={isPending}>
            {isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        <p className="text-muted-foreground">Workspace management coming soon.</p>
      </div>
    </div>
  )
}
