import { MessageSquareMore, SendHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { CinemaAvatar } from "./cinema-avatar";

type CommentUser = {
  username: string;
  fullName?: string;
  avatar?: string | null;
  profilePhoto?: string | null;
};

type MovieComment = CommentUser & {
  _id?: string;
  id?: string;
  text: string;
  createdAt: string | number | Date;
};

type PersistentCommentsPanelProps = {
  comments: MovieComment[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  currentUser?: CommentUser | null;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  composerDisabled?: boolean;
};

function formatTimestamp(timestamp: string | number | Date) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function PersistentCommentsPanel({
  comments,
  input,
  onInputChange,
  onSubmit,
  submitting = false,
  currentUser,
  title = "Movie Comments",
  subtitle = "Stored discussion tied to this movie, not live chat.",
  placeholder = "Share your thoughts about the movie...",
  emptyMessage = "No comments yet. Start the discussion.",
  className,
  composerDisabled = false,
}: PersistentCommentsPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/10 bg-black/35 p-5 text-white backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.38em] text-[#f4b63d]">
            <MessageSquareMore className="h-3.5 w-3.5" />
            Persistent Comments
          </div>
          <h3 className="mt-3 text-2xl font-black italic text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            {subtitle}
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
          {comments.length} stored
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <CinemaAvatar
            name={currentUser?.fullName || currentUser?.username || "Guest"}
            avatarId={currentUser?.avatar}
            profilePhoto={currentUser?.profilePhoto}
            size="md"
          />
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={placeholder}
              rows={4}
              disabled={composerDisabled || submitting}
              className="w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 text-sm text-white outline-none placeholder:text-white/35"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={onSubmit}
                disabled={composerDisabled || submitting || !input.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-[#f4b63d] px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-black disabled:opacity-50"
              >
                <SendHorizontal className="h-4 w-4" />
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {comments.map((comment) => (
          <div
            key={comment._id || comment.id || `${comment.username}-${comment.createdAt}`}
            className="rounded-[28px] border border-white/10 bg-white/5 p-5"
          >
            <div className="flex items-start gap-3">
              <CinemaAvatar
                name={comment.fullName || comment.username}
                avatarId={comment.avatar}
                profilePhoto={comment.profilePhoto}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-black text-white">
                      {comment.fullName || comment.username}
                    </div>
                    <div className="text-xs uppercase tracking-[0.28em] text-white/40">
                      @{comment.username}
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    {formatTimestamp(comment.createdAt)}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                  {comment.text}
                </p>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-white/10 p-6 text-sm text-white/50">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
