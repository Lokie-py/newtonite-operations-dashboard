import React, { useState } from 'react';
import { formatRelativeTime, getInitials } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Send, MessageSquare } from 'lucide-react';
import { validateComment } from '../../utils/validators';

export function CommentList({
  comments = [],
  onAddComment,
  currentUser,
  isSubmitting = false,
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateComment(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError('');
      await onAddComment(content.trim());
      setContent('');
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No discussion on this item yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-200"
            >
              {comment.authorAvatar ? (
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                  {getInitials(comment.authorName)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    {comment.authorName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmit} className="pt-2">
        <div className="flex items-start gap-2.5">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 mt-1 flex-shrink-0 hidden sm:block"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white items-center justify-center text-[11px] font-semibold mt-1 flex-shrink-0 hidden sm:flex">
              {getInitials(currentUser?.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError('');
              }}
              placeholder="Add an operational note or comment..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              disabled={isSubmitting}
            />

            {error && <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>}

            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-400">
                {1000 - content.length} chars remaining
              </span>

              <Button
                type="submit"
                variant="primary"
                size="xs"
                icon={Send}
                disabled={!content.trim() || isSubmitting}
                isLoading={isSubmitting}
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
