import { CinemaAvatar } from "@repo/ui/components/cinema-avatar";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  KeyRound,
  LogOut,
  Mail,
  MessageSquareMore,
  PencilLine,
  Sparkles,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type AuthUser } from "../../context/AuthContext";
import { apiGet, apiPatch, apiPost } from "../../utils/apiClient";
import { avatarCatalog } from "../../utils/avatarCatalog";

type ProfileSection =
  | "overview"
  | "username"
  | "password"
  | "avatar"
  | "photo"
  | "feedback"
  | "logout";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type RecommendationMovie = {
  title: string;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    crew?: Array<{ job?: string; name: string }>;
  };
};

type RecommendationPayload = {
  recommendations: Array<{
    movie: RecommendationMovie;
  }>;
  preferenceSummary?: {
    topGenres?: number;
    topCast?: number;
    topDirectors?: number;
    totalMoviesScored?: number;
    moviesReturned?: number;
  };
};

type RoomSummary = {
  roomId: string;
};

type ProfileInsights = {
  tagline: string;
  topGenres: string[];
  topDirectors: string[];
  recommendationCount: number;
  totalMoviesScored: number;
  roomsCount: number;
};

const genreMoodMap: Record<string, string> = {
  "science fiction": "mind-bending cinema",
  thriller: "late-night thrillers",
  mystery: "twisty mysteries",
  drama: "character-first dramas",
  action: "high-velocity set pieces",
  horror: "haunting midnight stories",
  romance: "sweeping screen chemistry",
  fantasy: "otherworldly sagas",
  crime: "noir-tinted crime stories",
  adventure: "big-screen adventures",
  animation: "stylized animated worlds",
  comedy: "sharp comedic detours",
  family: "warm shared-screen favorites",
};

const sectionMeta: Array<{
  id: ProfileSection;
  label: string;
  caption: string;
  icon: LucideIcon;
}> = [
  {
    id: "overview",
    label: "Profile",
    caption: "Detailed card and taste profile",
    icon: UserRound,
  },
  {
    id: "username",
    label: "Change Username",
    caption: "Update your public handle",
    icon: PencilLine,
  },
  {
    id: "password",
    label: "Change Password",
    caption: "Refresh account security",
    icon: KeyRound,
  },
  {
    id: "avatar",
    label: "Change Avatar",
    caption: "Swap your cinema persona",
    icon: Sparkles,
  },
  {
    id: "photo",
    label: "Change Profile Photo",
    caption: "Upload a separate portrait",
    icon: Camera,
  },
  {
    id: "feedback",
    label: "Feedback",
    caption: "Tell us what to improve",
    icon: MessageSquareMore,
  },
  {
    id: "logout",
    label: "Logout",
    caption: "End this session safely",
    icon: LogOut,
  },
];

function formatJoinDate(timestamp?: string) {
  if (!timestamp) {
    return "Recently joined";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently joined";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildTagline(topGenres: string[], topDirectors: string[]) {
  if (topGenres.length >= 2) {
    const [first, second] = topGenres.map(
      (genre) => genreMoodMap[genre.toLowerCase()] || genre.toLowerCase(),
    );

    return `A lover of ${first} and ${second}`;
  }

  if (topGenres.length === 1) {
    const mood = genreMoodMap[topGenres[0].toLowerCase()] || topGenres[0].toLowerCase();
    return `Drawn to ${mood} with a curator's instinct for what to watch next`;
  }

  if (topDirectors.length > 0) {
    return `Always chasing the next standout pick with ${topDirectors[0]}-level ambition`;
  }

  return "Always curating a sharper shared-screen experience";
}

function collectTopGenres(movies: RecommendationMovie[]) {
  const counts = new Map<string, number>();

  movies.forEach((movie) => {
    movie.genres?.forEach((genre) => {
      counts.set(genre.name, (counts.get(genre.name) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([genre]) => genre);
}

function collectTopDirectors(movies: RecommendationMovie[]) {
  const counts = new Map<string, number>();

  movies.forEach((movie) => {
    movie.credits?.crew
      ?.filter((member) => member.job === "Director")
      .forEach((member) => {
        counts.set(member.name, (counts.get(member.name) || 0) + 1);
      });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name]) => name);
}

export function ProfilePanel({
  isOpen,
  initialSection,
  onClose,
}: {
  isOpen: boolean;
  initialSection: ProfileSection;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { user, setSessionUser } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState("");
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    status: "",
    saving: false,
  });
  const [feedbackState, setFeedbackState] = useState({
    message: "",
    rating: 5,
    status: "",
    saving: false,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [insights, setInsights] = useState<ProfileInsights>({
    tagline: buildTagline([], []),
    topGenres: [],
    topDirectors: [],
    recommendationCount: 0,
    totalMoviesScored: 0,
    roomsCount: 0,
  });
  const [insightsLoading, setInsightsLoading] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    setActiveSection(initialSection);
  }, [initialSection, isOpen]);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    if (wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = true;
    setUsernameValue(user.username);
    setUsernameStatus("");
    setSelectedAvatar(user.avatar || avatarCatalog[0]?.id || "");
    setAvatarStatus("");
    setPasswordState({
      currentPassword: "",
      newPassword: "",
      status: "",
      saving: false,
    });
    setFeedbackState({
      message: "",
      rating: 5,
      status: "",
      saving: false,
    });
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoStatus("");
  }, [isOpen, user]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    let cancelled = false;

    const loadInsights = async () => {
      setInsightsLoading(true);

      try {
        const [recommendationResponse, roomResponse] = await Promise.all([
          apiGet<ApiResponse<RecommendationPayload>>("/movies/recommendations", {
            username: user.username,
          }).catch(() => null),
          apiGet<ApiResponse<RoomSummary[]>>("/rooms/mine").catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        const recommendationMovies =
          recommendationResponse?.data?.recommendations?.map((item) => item.movie) || [];
        const topGenres = collectTopGenres(recommendationMovies);
        const topDirectors = collectTopDirectors(recommendationMovies);

        setInsights({
          tagline: buildTagline(topGenres, topDirectors),
          topGenres,
          topDirectors,
          recommendationCount:
            recommendationResponse?.data?.preferenceSummary?.moviesReturned ||
            recommendationMovies.length,
          totalMoviesScored:
            recommendationResponse?.data?.preferenceSummary?.totalMoviesScored || 0,
          roomsCount: roomResponse?.data?.length || 0,
        });
      } finally {
        if (!cancelled) {
          setInsightsLoading(false);
        }
      }
    };

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  const joinedLabel = useMemo(() => formatJoinDate(user?.createdAt), [user?.createdAt]);
  const topGenreLabel = insights.topGenres.slice(0, 3);
  const currentPhoto = photoPreview || user?.profilePhoto || "";

  const handleUsernameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (usernameValue.trim().toLowerCase() === user.username.toLowerCase()) {
      setUsernameStatus("This handle is already active on your account.");
      return;
    }

    setUsernameSaving(true);
    setUsernameStatus("Saving your new username...");

    try {
      const response = await apiPatch<ApiResponse<{ user: AuthUser }>>("/users/profile", {
        username: usernameValue.trim(),
      });
      setSessionUser(response.data.user);
      setUsernameValue(response.data.user.username);
      setUsernameStatus("Username updated successfully.");
    } catch (error) {
      setUsernameStatus(
        error instanceof Error ? error.message : "Username update failed.",
      );
    } finally {
      setUsernameSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setPasswordState((previous) => ({
      ...previous,
      saving: true,
      status: "Updating your password...",
    }));

    try {
      await apiPatch("/users/password", {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });
      setPasswordState({
        currentPassword: "",
        newPassword: "",
        status: "Password updated successfully.",
        saving: false,
      });
    } catch (error) {
      setPasswordState((previous) => ({
        ...previous,
        saving: false,
        status: error instanceof Error ? error.message : "Password update failed.",
      }));
    }
  };

  const handleAvatarSave = async () => {
    if (!user) {
      return;
    }

    if (selectedAvatar === user.avatar) {
      setAvatarStatus("This avatar is already active.");
      return;
    }

    setAvatarSaving(true);
    setAvatarStatus("Syncing your avatar...");

    try {
      const response = await apiPatch<ApiResponse<{ user: AuthUser }>>("/users/avatar", {
        avatar: selectedAvatar,
      });
      setSessionUser(response.data.user);
      setAvatarStatus("Avatar updated successfully.");
    } catch (error) {
      setAvatarStatus(error instanceof Error ? error.message : "Avatar update failed.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handlePhotoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!photoFile) {
      setPhotoStatus("Choose an image first.");
      return;
    }

    setPhotoSaving(true);
    setPhotoStatus("Uploading your profile photo...");

    try {
      const formData = new FormData();
      formData.append("profilePhoto", photoFile);

      const response = await apiPatch<ApiResponse<{ user: AuthUser }>>(
        "/users/profile",
        formData,
      );

      setSessionUser(response.data.user);
      setPhotoFile(null);
      setPhotoPreview("");
      setPhotoStatus("Profile photo updated successfully.");
    } catch (error) {
      setPhotoStatus(
        error instanceof Error ? error.message : "Profile photo update failed.",
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleFeedbackSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFeedbackState((previous) => ({
      ...previous,
      saving: true,
      status: "Sending your feedback...",
    }));

    try {
      await apiPost("/users/feedback", {
        message: feedbackState.message,
        rating: feedbackState.rating,
        category: "experience",
      });

      setFeedbackState({
        message: "",
        rating: 5,
        status: "Feedback submitted. Thank you.",
        saving: false,
      });
    } catch (error) {
      setFeedbackState((previous) => ({
        ...previous,
        saving: false,
        status: error instanceof Error ? error.message : "Feedback failed.",
      }));
    }
  };

  const handleLogout = async () => {
    await apiGet("/users/logout").catch(() => null);
    setSessionUser(null);
    onClose();
    startTransition(() => {
      void navigate("/login");
    });
  };

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="profile-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.aside
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="ml-auto flex h-full w-full max-w-6xl flex-col border-l border-white/10 bg-[#12100d]/98 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.42em] text-primary">
                  Profile Suite
                </div>
                <div className="mt-2 text-sm text-white/50">
                  Premium identity controls tuned for keyboard-first navigation.
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary/30 hover:text-white"
                aria-label="Close profile panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 pt-5 sm:px-7">
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(244,182,61,0.28),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(18,16,13,0.1),rgba(18,16,13,0.76))]" />
                <div className="relative grid gap-8 px-6 py-7 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                  <div className="max-w-2xl">
                    <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                      Account identity
                    </div>
                    <h2 className="mt-5 text-4xl font-black italic tracking-tight text-white sm:text-5xl">
                      {user.fullName}
                    </h2>
                    <div className="mt-3 text-sm uppercase tracking-[0.28em] text-white/45">
                      @{user.username}
                    </div>
                    <p className="mt-6 max-w-xl text-lg italic leading-8 text-white/70">
                      "{insights.tagline}"
                    </p>
                  </div>

                  <div className="flex items-center justify-start lg:justify-end">
                    <div className="relative h-40 w-40 sm:h-48 sm:w-48">
                      {currentPhoto ? (
                        <img
                          src={currentPhoto}
                          alt={user.fullName}
                          className="h-full w-full rounded-[32px] border border-white/10 object-cover shadow-2xl"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(244,182,61,0.25),rgba(255,255,255,0.05))] text-4xl font-black uppercase text-white shadow-2xl">
                          {user.fullName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() ?? "")
                            .join("")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-[-24px] left-6 sm:left-8">
                  <div className="rounded-[28px] border border-white/10 bg-[#171410]/95 p-3 shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center gap-3">
                      <CinemaAvatar
                        name={user.fullName}
                        avatarId={user.avatar}
                        size="lg"
                      />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                          Active Avatar
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          Separate from your profile photo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative grid gap-4 border-t border-white/10 px-6 pb-6 pt-16 sm:grid-cols-2 xl:grid-cols-4 xl:px-8">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                      Username
                    </div>
                    <div className="mt-3 text-lg font-black text-white">@{user.username}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-white/55">
                      <Mail className="h-4 w-4 text-primary" />
                      {user.email}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                      Joined
                    </div>
                    <div className="mt-3 text-lg font-black text-white">{joinedLabel}</div>
                    <div className="mt-2 text-sm text-white/55">
                      Your profile updates stay synced across rooms and comments.
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                      Preferences
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {topGenreLabel.length > 0 ? (
                        topGenreLabel.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                          >
                            {genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/55">
                          Watch activity will sharpen this profile over time.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                      Stats
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Rooms", value: insights.roomsCount },
                        { label: "Recs", value: insights.recommendationCount },
                        { label: "Signals", value: insights.totalMoviesScored },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3"
                        >
                          <div className="text-xl font-black text-white">{stat.value}</div>
                          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[280px_1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {sectionMeta.map((section) => {
                      const SectionIcon = section.icon;
                      const isActive = activeSection === section.id;

                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                            isActive
                              ? "border-primary/35 bg-primary/10 shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
                              : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-2xl bg-black/20 p-3 text-primary">
                              <SectionIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-black uppercase tracking-[0.2em] text-white">
                                {section.label}
                              </div>
                              <div className="mt-1 text-sm leading-6 text-white/50">
                                {section.caption}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {activeSection === "overview" && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Personalized Snapshot
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Your profile is ready for every room, review, and recommendation.
                          </h3>
                          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                            This card combines your account identity, watch-party presence,
                            and recommendation signals into one place. Update your username,
                            avatar, and portrait independently so your cinematic identity feels
                            deliberate instead of improvised.
                          </p>

                          <div className="mt-8 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                              <div className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                                Favorite directions
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {insights.topDirectors.length > 0 ? (
                                  insights.topDirectors.map((director) => (
                                    <span
                                      key={director}
                                      className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/65"
                                    >
                                      {director}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-white/50">
                                    Directors will appear here as your recommendation profile
                                    fills out.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                              <div className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                                Shortcut flow
                              </div>
                              <div className="mt-4 grid gap-3 text-sm text-white/60">
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                  `Ctrl + K` opens search and quick actions.
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                  `Ctrl + R` jumps straight to rooms.
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                  `Ctrl + P` opens this profile suite from anywhere.
                                </div>
                              </div>
                            </div>
                          </div>

                          {insightsLoading && (
                            <div className="mt-6 text-sm text-white/45">
                              Refreshing your profile insights...
                            </div>
                          )}
                        </div>
                      )}

                      {activeSection === "username" && (
                        <form className="space-y-5" onSubmit={handleUsernameSubmit}>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Change Username
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Pick the handle that follows you into every room.
                          </h3>
                          <input
                            value={usernameValue}
                            onChange={(event) => setUsernameValue(event.target.value)}
                            placeholder="username"
                            className="w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white outline-none placeholder:text-white/30"
                          />
                          <p className="text-sm leading-7 text-white/55">
                            Usernames sync across your recommendations, rooms, and persistent
                            comments so your identity stays consistent.
                          </p>
                          <button
                            disabled={usernameSaving || !usernameValue.trim()}
                            className="rounded-full bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                          >
                            {usernameSaving ? "Saving..." : "Save Username"}
                          </button>
                          {usernameStatus && (
                            <div className="text-sm text-white/60">{usernameStatus}</div>
                          )}
                        </form>
                      )}

                      {activeSection === "password" && (
                        <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Change Password
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Refresh your credentials without leaving the flow.
                          </h3>
                          <input
                            type="password"
                            placeholder="Current password"
                            value={passwordState.currentPassword}
                            onChange={(event) =>
                              setPasswordState((previous) => ({
                                ...previous,
                                currentPassword: event.target.value,
                              }))
                            }
                            className="w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white outline-none placeholder:text-white/30"
                          />
                          <input
                            type="password"
                            placeholder="New password"
                            value={passwordState.newPassword}
                            onChange={(event) =>
                              setPasswordState((previous) => ({
                                ...previous,
                                newPassword: event.target.value,
                              }))
                            }
                            className="w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white outline-none placeholder:text-white/30"
                          />
                          <button
                            disabled={
                              passwordState.saving ||
                              !passwordState.currentPassword.trim() ||
                              !passwordState.newPassword.trim()
                            }
                            className="rounded-full bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                          >
                            {passwordState.saving ? "Updating..." : "Save Password"}
                          </button>
                          {passwordState.status && (
                            <div className="text-sm text-white/60">
                              {passwordState.status}
                            </div>
                          )}
                        </form>
                      )}

                      {activeSection === "avatar" && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Change Avatar
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Swap the persona that shows up on cards, rooms, and comments.
                          </h3>

                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {avatarCatalog.map((avatar) => (
                              <button
                                key={avatar.id}
                                onClick={() => setSelectedAvatar(avatar.id)}
                                className={`rounded-[28px] border p-5 text-left transition-all ${
                                  selectedAvatar === avatar.id
                                    ? "border-primary/40 bg-primary/10 shadow-[0_20px_40px_rgba(0,0,0,0.22)]"
                                    : "border-white/10 bg-black/20 hover:border-primary/20"
                                }`}
                              >
                                <div
                                  className={`flex h-28 items-end rounded-[24px] bg-gradient-to-br ${avatar.accent} p-4`}
                                >
                                  <CinemaAvatar
                                    name={user.fullName}
                                    avatarId={avatar.id}
                                    size="md"
                                  />
                                </div>
                                <div className="mt-4 text-lg font-black uppercase tracking-tight text-white">
                                  {avatar.title}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-white/55">
                                  {avatar.description}
                                </div>
                              </button>
                            ))}
                          </div>

                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                              onClick={handleAvatarSave}
                              disabled={avatarSaving || !selectedAvatar}
                              className="rounded-full bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                            >
                              {avatarSaving ? "Saving..." : "Save Avatar"}
                            </button>
                            {avatarStatus && (
                              <div className="text-sm text-white/60">{avatarStatus}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeSection === "photo" && (
                        <form className="space-y-5" onSubmit={handlePhotoSubmit}>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Change Profile Photo
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Keep your portrait separate from the avatar that sits on the card.
                          </h3>

                          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                            <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-black/20 p-4">
                              {currentPhoto ? (
                                <img
                                  src={currentPhoto}
                                  alt={user.fullName}
                                  className="h-44 w-44 rounded-[28px] object-cover"
                                />
                              ) : (
                                <div className="flex h-44 w-44 items-center justify-center rounded-[28px] border border-dashed border-white/10 text-center text-sm leading-6 text-white/45">
                                  Upload a portrait
                                  <br />
                                  for this profile.
                                </div>
                              )}
                            </div>

                            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                              <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                                <Upload className="h-4 w-4 text-primary" />
                                <span>{photoFile ? photoFile.name : "Choose profile photo"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    setPhotoFile(event.target.files?.[0] || null)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <p className="mt-4 text-sm leading-7 text-white/55">
                                This image becomes the large portrait in your premium profile
                                card. Your selected avatar stays separate for room presence and
                                compact identity moments.
                              </p>
                              <button
                                disabled={photoSaving || !photoFile}
                                className="mt-6 rounded-full bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                              >
                                {photoSaving ? "Uploading..." : "Save Profile Photo"}
                              </button>
                              {photoStatus && (
                                <div className="mt-4 text-sm text-white/60">{photoStatus}</div>
                              )}
                            </div>
                          </div>
                        </form>
                      )}

                      {activeSection === "feedback" && (
                        <form className="space-y-5" onSubmit={handleFeedbackSubmit}>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Feedback
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Tell us what would make the product feel even better.
                          </h3>
                          <select
                            value={feedbackState.rating}
                            onChange={(event) =>
                              setFeedbackState((previous) => ({
                                ...previous,
                                rating: Number(event.target.value),
                              }))
                            }
                            className="w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white outline-none"
                          >
                            {[5, 4, 3, 2, 1].map((value) => (
                              <option key={value} value={value}>
                                {value} / 5
                              </option>
                            ))}
                          </select>
                          <textarea
                            value={feedbackState.message}
                            onChange={(event) =>
                              setFeedbackState((previous) => ({
                                ...previous,
                                message: event.target.value,
                              }))
                            }
                            placeholder="Tell us where the navigation or profile experience can improve."
                            className="min-h-40 w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white outline-none placeholder:text-white/30"
                          />
                          <button
                            disabled={feedbackState.saving || !feedbackState.message.trim()}
                            className="rounded-full bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                          >
                            {feedbackState.saving ? "Sending..." : "Send Feedback"}
                          </button>
                          {feedbackState.status && (
                            <div className="text-sm text-white/60">
                              {feedbackState.status}
                            </div>
                          )}
                        </form>
                      )}

                      {activeSection === "logout" && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                            Logout
                          </div>
                          <h3 className="mt-4 text-3xl font-black italic text-white">
                            Sign out cleanly and keep your identity changes saved.
                          </h3>
                          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                            Logging out clears the active session, but your avatar, profile
                            photo, and personalized recommendation signals remain stored on
                            your account.
                          </p>
                          <button
                            onClick={handleLogout}
                            className="mt-6 rounded-full border border-primary/25 bg-primary/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
