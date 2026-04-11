import React from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import type { Post } from '../gen/api/schemas'

export function PostRow({
  post,
  onDelete,
  variant = 'default'
}: {
  post: Post
  onDelete: (id: string) => void
  variant?: 'default' | 'compact'
}): React.JSX.Element {
  const timeStr = new Date(post.posted_at * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (variant === 'compact') {
    return (
      <div
        className="group flex items-start gap-2 rounded-md border bg-card/80 px-2 py-1.5"
        style={{ borderColor: 'var(--border-l)' }}
      >
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[11px] leading-snug whitespace-pre-wrap line-clamp-3">{post.body}</p>
          {(post.events.length > 0 || post.todos.length > 0) && (
            <div className="flex flex-wrap gap-0.5">
              {post.events.map((ev) => (
                <Badge key={`ev-${ev.id}`} variant="outline" className="text-[9px] px-1 py-0 h-4">
                  {ev.title}
                </Badge>
              ))}
              {post.todos.map((td) => (
                <Badge key={`td-${td.id}`} variant="outline" className="text-[9px] px-1 py-0 h-4">
                  {td.title}
                </Badge>
              ))}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
          onClick={() => onDelete(post.id)}
          title="Delete post"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>

        {(post.events.length > 0 || post.todos.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {post.events.map((ev) => (
              <Badge key={`ev-${ev.id}`} variant="outline" className="text-xs">
                {ev.title}
              </Badge>
            ))}
            {post.todos.map((td) => (
              <Badge key={`td-${td.id}`} variant="outline" className="text-xs">
                {td.title}
              </Badge>
            ))}
          </div>
        )}

        <span className="block text-xs text-muted-foreground">{timeStr}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={() => onDelete(post.id)}
        title="Delete post"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
