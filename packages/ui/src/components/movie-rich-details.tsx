import * as React from "react";
import { CalendarDays, Clock3, Film, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { CinemaAvatar } from "./cinema-avatar";

type PersonCard = {
  id?: string | number;
  name: string;
  subtitle?: string;
  image?: string | null;
};

type MovieRichDetailsProps = {
  title: string;
  overview?: string | null;
  genres?: string[];
  releaseDate?: string | Date | null;
  rating?: number | null;
  runtime?: number | null;
  director?: PersonCard | null;
  actors?: PersonCard[];
  poster?: string | null;
  className?: string;
  compact?: boolean;
};

function formatReleaseDate(releaseDate?: string | Date | null) {
  if (!releaseDate) return "Unknown";

  const date =
    typeof releaseDate === "string" ? new Date(releaseDate) : releaseDate;

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRuntime(runtime?: number | null) {
  if (!runtime) return "Unknown";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function MetaPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white/90">{value}</div>
    </div>
  );
}

export function MovieRichDetails({
  title,
  overview,
  genres = [],
  releaseDate,
  rating,
  runtime,
  director,
  actors = [],
  poster,
  className,
  compact = false,
}: MovieRichDetailsProps) {
  const topActors = actors.slice(0, compact ? 4 : 5);

  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/10 bg-black/30 p-5 text-white backdrop-blur-xl",
        compact ? "space-y-6" : "space-y-8",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-6",
          poster
            ? compact
              ? "md:grid-cols-[160px_1fr]"
              : "lg:grid-cols-[220px_1fr]"
            : "grid-cols-1",
        )}
      >
        {poster && (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
            <img
              src={poster}
              alt={title}
              className={cn(
                "w-full object-cover",
                compact ? "h-[220px]" : "h-[320px]",
              )}
            />
          </div>
        )}

        <div className="space-y-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.42em] text-[#f4b63d]">
              Rich Movie Details
            </div>
            <h2
              className={cn(
                "mt-3 break-words text-balance font-black italic tracking-tight text-white leading-[0.94]",
                compact ? "text-3xl" : "text-4xl md:text-5xl",
              )}
            >
              {title}
            </h2>
            <p className="mt-4 max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-white/70 md:text-base">
              {overview || "No overview available for this title yet."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetaPill
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Release"
              value={formatReleaseDate(releaseDate)}
            />
            <MetaPill
              icon={<Star className="h-3.5 w-3.5" />}
              label="Rating"
              value={rating ? rating.toFixed(1) : "Unrated"}
            />
            <MetaPill
              icon={<Clock3 className="h-3.5 w-3.5" />}
              label="Duration"
              value={formatRuntime(runtime)}
            />
            <MetaPill
              icon={<Film className="h-3.5 w-3.5" />}
              label="Genres"
              value={genres.length ? genres.slice(0, 3).join(", ") : "Unknown"}
            />
          </div>
        </div>
      </div>

      {director && (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.38em] text-white/45">
            Director
          </div>
          <div className="mt-4 flex items-center gap-4">
            <CinemaAvatar
              name={director.name}
              profilePhoto={director.image}
              size={compact ? "lg" : "xl"}
            />
            <div>
              <div className="break-words text-2xl font-black text-white">
                {director.name}
              </div>
              {director.subtitle && (
                <div className="mt-1 text-sm text-white/60">{director.subtitle}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.38em] text-white/45">
              Main Cast
            </div>
            <div className="mt-2 text-xl font-black text-white">
              Top {topActors.length || 0} actors
            </div>
          </div>
          <div className="text-sm leading-6 text-white/45">
            {genres.length
              ? genres.join(" • ")
              : "Cast details from movie metadata"}
          </div>
        </div>

        <div
          className={cn(
            "mt-5 grid gap-4",
            compact ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-5",
          )}
        >
          {topActors.map((actor) => (
            <div
              key={actor.id ?? actor.name}
              className="rounded-[24px] border border-white/10 bg-black/30 p-4"
            >
              <CinemaAvatar
                name={actor.name}
                profilePhoto={actor.image}
                size="xl"
                className="mx-auto"
              />
              <div className="mt-4 text-center">
                <div className="break-words text-base font-black text-white">
                  {actor.name}
                </div>
                <div className="mt-1 text-sm text-white/55">
                  {actor.subtitle || "Cast"}
                </div>
              </div>
            </div>
          ))}

          {topActors.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-white/10 p-5 text-sm text-white/55">
              Cast metadata is not available for this title yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
