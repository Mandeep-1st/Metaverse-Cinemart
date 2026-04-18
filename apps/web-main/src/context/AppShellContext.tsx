import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Clapperboard,
  Home,
  KeyRound,
  MessageSquareMore,
  PencilLine,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CommandPalette, type CommandPaletteItem } from "../components/app/CommandPalette";
import { ProfilePanel } from "../components/app/ProfilePanel";
import { useAuth } from "./AuthContext";
import {
  AppShellContext,
  type AppShellContextValue,
  type AppShellProfileSection,
} from "./app-shell-context";
import { apiGet, apiPost } from "../utils/apiClient";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type SearchMovie = {
  tmdb_id: number;
  title: string;
  overview?: string;
  images?: {
    poster?: string | null;
    backdrop?: string | null;
  };
  metrics?: {
    vote_average?: number;
  };
  details?: {
    release_date?: string;
  };
};

export function AppShellProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [movieResults, setMovieResults] = useState<SearchMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [profileSection, setProfileSection] = useState<AppShellProfileSection>("overview");
  const deferredQuery = useDeferredValue(commandQuery);

  const closeCommandPalette = useCallback(() => {
    setCommandOpen(false);
    setCommandQuery("");
    setMovieResults([]);
    setSearching(false);
  }, []);

  const closeProfilePanel = useCallback(() => {
    setProfileOpen(false);
    setProfileSection("overview");
  }, []);

  const openCommandPalette = useCallback(() => {
    closeProfilePanel();
    setCommandOpen(true);
  }, [closeProfilePanel]);

  const openProfilePanel = useCallback(
    (section: AppShellProfileSection = "overview") => {
      closeCommandPalette();
      setProfileSection(section);
      setProfileOpen(true);
    },
    [closeCommandPalette],
  );

  const goToRoute = useCallback(
    (path: string) => {
      closeCommandPalette();
      closeProfilePanel();
      startTransition(() => {
        void navigate(path);
      });
    },
    [closeCommandPalette, closeProfilePanel, navigate],
  );

  const openMovie = useCallback(
    (movieId: number) => {
      if (!user) {
        return;
      }

      closeCommandPalette();
      apiPost("/movies/whenclicked", {
        username: user.username,
        movie: movieId,
      }).catch(() => {});
      startTransition(() => {
        void navigate(`/movies/${movieId}`);
      });
    },
    [closeCommandPalette, navigate, user],
  );

  useEffect(() => {
    if (!isCommandOpen || !deferredQuery.trim()) {
      setMovieResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const query = deferredQuery.trim();
    const timeout = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await apiGet<ApiResponse<SearchMovie[]>>("/movies/search", {
          query,
        });

        if (!cancelled) {
          setMovieResults(response.data.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          setMovieResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [deferredQuery, isCommandOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = event.ctrlKey || event.metaKey;

      if (modifierPressed && !event.altKey) {
        const key = event.key.toLowerCase();

        if (key === "k") {
          event.preventDefault();
          openCommandPalette();
          return;
        }

        if (key === "r") {
          event.preventDefault();
          goToRoute("/rooms");
          return;
        }

        if (key === "p") {
          event.preventDefault();
          openProfilePanel("overview");
          return;
        }
      }

      if (event.key === "Escape") {
        if (isCommandOpen) {
          closeCommandPalette();
          return;
        }

        if (isProfileOpen) {
          closeProfilePanel();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    closeCommandPalette,
    closeProfilePanel,
    goToRoute,
    isCommandOpen,
    isProfileOpen,
    openCommandPalette,
    openProfilePanel,
  ]);

  const quickActions = useMemo<CommandPaletteItem[]>(
    () => [
      {
        id: "home",
        type: "action",
        icon: Home,
        label: "Home",
        description: "Return to the cinematic home hub.",
        onSelect: () => goToRoute("/home"),
      },
      {
        id: "rooms",
        type: "action",
        icon: Clapperboard,
        label: "Open Rooms",
        description: "Jump straight to your room dashboard.",
        shortcut: "Ctrl + R",
        onSelect: () => goToRoute("/rooms"),
      },
      {
        id: "profile",
        type: "action",
        icon: UserRound,
        label: "Open Profile",
        description: "Open the premium profile card and account controls.",
        shortcut: "Ctrl + P",
        onSelect: () => openProfilePanel("overview"),
      },
      {
        id: "username",
        type: "action",
        icon: PencilLine,
        label: "Change Username",
        description: "Update the handle shown in rooms and recommendations.",
        onSelect: () => openProfilePanel("username"),
      },
      {
        id: "password",
        type: "action",
        icon: KeyRound,
        label: "Change Password",
        description: "Refresh account security from the profile suite.",
        onSelect: () => openProfilePanel("password"),
      },
      {
        id: "avatar",
        type: "action",
        icon: Sparkles,
        label: "Change Avatar",
        description: "Swap the persona used across room presence and comments.",
        onSelect: () => openProfilePanel("avatar"),
      },
      {
        id: "photo",
        type: "action",
        icon: Upload,
        label: "Change Profile Photo",
        description: "Upload a portrait without affecting the selected avatar.",
        onSelect: () => openProfilePanel("photo"),
      },
      {
        id: "feedback",
        type: "action",
        icon: MessageSquareMore,
        label: "Feedback",
        description: "Send product feedback from the profile suite.",
        onSelect: () => openProfilePanel("feedback"),
      },
    ],
    [goToRoute, openProfilePanel],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const actionItems = normalizedQuery
      ? quickActions.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery),
        )
      : quickActions;

    const movieItems: CommandPaletteItem[] = movieResults.map((movie) => {
      const releaseYear = movie.details?.release_date
        ? new Date(movie.details.release_date).getFullYear()
        : null;
      const score = movie.metrics?.vote_average?.toFixed(1);

      return {
        id: `movie-${movie.tmdb_id}`,
        type: "movie",
        label: movie.title,
        description: movie.overview || "Open the movie hub",
        poster: movie.images?.poster || movie.images?.backdrop,
        meta:
          releaseYear || score
            ? [releaseYear, score ? `IMDb ${score}` : null].filter(Boolean).join(" · ")
            : "Movie",
        onSelect: () => openMovie(movie.tmdb_id),
      };
    });

    return normalizedQuery ? [...actionItems, ...movieItems] : actionItems;
  }, [deferredQuery, movieResults, openMovie, quickActions]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      openCommandPalette,
      openProfilePanel,
    }),
    [openCommandPalette, openProfilePanel],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
      <CommandPalette
        isOpen={isCommandOpen}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        onClose={closeCommandPalette}
        items={visibleItems}
        searching={searching}
      />
      <ProfilePanel
        isOpen={isProfileOpen}
        initialSection={profileSection}
        onClose={closeProfilePanel}
      />
    </AppShellContext.Provider>
  );
}
