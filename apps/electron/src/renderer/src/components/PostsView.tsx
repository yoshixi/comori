import React, { useState, useCallback, useMemo } from 'react'
import { PostComposer, type PostComposerContext } from './PostComposer'
import { PostRow } from './PostRow'
import { usePosts } from '../hooks/usePosts'
import { useTodos } from '../hooks/useTodos'
import { useLocalDayBounds } from '../hooks/useLocalDayBounds'
export function PostsView(): React.JSX.Element {
  const { from, to } = useLocalDayBounds()
  const { posts, isLoading, createPost, deletePost } = usePosts({ from, to })

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

  const postsTimeline = useMemo(
    () => [...posts].sort((a, b) => b.posted_at - a.posted_at),
    [posts]
  )

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-8">
      <main className="flex min-h-0 flex-1 flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and search your log. Quick capture lives on Today.
          </p>
        </div>

        <PostComposer
          currentContext={currentContext}
          onClearContext={handleClearContext}
          onSubmit={handleSubmit}
          onSelectContext={setCurrentContext}
          todosForSuggestion={todayTodos}
        />

        <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Loading posts...</p>
            </div>
          ) : postsTimeline.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No posts yet. Add one here or from the Today tab.</p>
            </div>
          ) : (
            postsTimeline.map((post) => <PostRow key={post.id} post={post} onDelete={deletePost} />)
          )}
        </div>
      </main>
    </div>
  )
}
