import React, { useState, useCallback, useEffect, useRef } from 'react'
import { PostComposer, type PostComposerContext } from './PostComposer'
import { PostRow } from './PostRow'
import { usePostsFeed } from '../hooks/usePostsFeed'
import { useTodos } from '../hooks/useTodos'
import { useLocalDayBounds } from '../hooks/useLocalDayBounds'
import { Button } from './ui/button'

export function PostsView(): React.JSX.Element {
  const { from, to } = useLocalDayBounds()
  const {
    posts,
    initialLoading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
    createPost,
    updatePost,
    deletePost
  } = usePostsFeed()

  const { todos: todayTodos } = useTodos({ from, to })

  const [currentContext, setCurrentContext] = useState<PostComposerContext>(null)

  const handleClearContext = useCallback(() => {
    setCurrentContext(null)
  }, [])

  const handleSubmit = useCallback(
    (body: string) => {
      const eventIds: number[] = currentContext?.type === 'event' ? [currentContext.id] : []
      const todoIds: string[] = currentContext?.type === 'todo' ? [currentContext.id] : []
      void createPost(body, eventIds, todoIds)
    },
    [currentContext, createPost]
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && hasMore && !loadingMore && !initialLoading) {
          void loadMore()
        }
      },
      { root, rootMargin: '160px', threshold: 0 }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, initialLoading, loadMore, posts.length])

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-8">
      <main className="flex min-h-0 flex-1 flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your full log, newest first. More load as you scroll.
          </p>
        </div>

        <PostComposer
          draftStorageKey={`techoo.posts.postDraft.v1.${from}`}
          currentContext={currentContext}
          onClearContext={handleClearContext}
          onSubmit={handleSubmit}
          onSelectContext={setCurrentContext}
          todosForSuggestion={todayTodos}
        />

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p className="text-destructive">Could not load posts.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2 h-8" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto"
        >
          {initialLoading && posts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Loading posts…</p>
            </div>
          ) : posts.length === 0 && !error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No posts yet. Add one here or from the Today tab.</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostRow key={post.id} post={post} onUpdatePost={updatePost} onDelete={deletePost} />
              ))}
              <div ref={sentinelRef} className="h-1 w-full shrink-0" aria-hidden />
              {loadingMore && (
                <p className="py-3 text-center text-xs text-muted-foreground">Loading more…</p>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="py-2 text-center text-[11px] text-muted-foreground">End of log</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
