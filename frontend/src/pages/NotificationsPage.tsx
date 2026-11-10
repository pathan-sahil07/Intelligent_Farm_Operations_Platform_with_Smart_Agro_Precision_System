import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { notificationApi } from '@/api/endpoints'
import { EmptyState, ErrorState, Loading } from '@/components/common/StateViews'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { useRun } from '@/hooks/useRun'
import { formatDateTime } from '@/lib/format'

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { act } = useRun(['notifications', 'notification-count'])
  const q = useQuery({ queryKey: ['notifications', unreadOnly], queryFn: () => notificationApi.list({ unreadOnly: unreadOnly || undefined, size: 50 }) })
  return (
    <>
      <PageHeader title="Notifications" description="Low stock, maintenance, irrigation, harvest, task and weather alerts."
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => act(() => notificationApi.refresh(), 'Notifications refreshed')}>Check now</Button>
          <Button variant="secondary" onClick={() => act(() => notificationApi.readAll(), 'All marked as read')}>Mark all read</Button>
        </div>} />
      <Panel title="Inbox" actions={<label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread only</label>}>
        {q.isLoading ? <Loading /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data?.content.length ? (
          <ul className="divide-y divide-neutral-100">
            {q.data.content.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className={n.read ? 'text-neutral-700' : 'font-semibold text-neutral-900'}>{n.title}</p>
                  {n.message && <p className="text-neutral-600">{n.message}</p>}
                  <p className="text-xs text-neutral-500">{n.type.replace(/_/g, ' ')} · {formatDateTime(n.createdAt)}</p>
                  {n.link && <Link className="text-xs text-brand-700 underline" to={n.link}>Open</Link>}
                </div>
                {!n.read && <Button size="sm" variant="ghost" onClick={() => act(() => notificationApi.markRead(n.id))}>Mark read</Button>}
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No notifications" description="Alerts appear here when something needs attention." />}
      </Panel>
    </>
  )
}
