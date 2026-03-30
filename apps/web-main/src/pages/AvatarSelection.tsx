import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPatch } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

const avatars = [
  {
    id: "neo-scout",
    title: "Neo Scout",
    accent: "from-red-500 to-orange-400",
  },
  {
    id: "quantum-noir",
    title: "Quantum Noir",
    accent: "from-sky-500 to-cyan-300",
  },
  {
    id: "signal-rider",
    title: "Signal Rider",
    accent: "from-emerald-500 to-lime-400",
  },
  {
    id: "void-caster",
    title: "Void Caster",
    accent: "from-fuchsia-500 to-pink-400",
  },
  {
    id: "reel-drifter",
    title: "Reel Drifter",
    accent: "from-amber-500 to-yellow-300",
  },
  {
    id: "echo-pilot",
    title: "Echo Pilot",
    accent: "from-violet-500 to-indigo-300",
  },
];

type AvatarResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
      fullName: string;
      avatar?: string;
      profilePhoto?: string;
      isVerified: boolean;
      role: "admin" | "user";
    };
  };
};

export default function AvatarSelection() {
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, setSessionUser } = useAuth();

  const handleSave = async () => {
    if (!selected) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await apiPatch<AvatarResponse>("/users/avatar", {
        avatar: selected,
      });
      setSessionUser(response.data.user);
      navigate("/home");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Avatar save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.16),_transparent_45%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-2xl">
          <div className="mb-4 text-primary text-[10px] font-black uppercase tracking-[0.5em]">
            Character Selection
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
            Pick your avatar
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {user?.fullName || "Explorer"}, choose the persona that follows you into the cinema.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              className={`group rounded-[var(--radius)] border p-6 text-left transition-all ${
                selected === avatar.id
                  ? "border-primary bg-card/60 shadow-2xl"
                  : "border-border/20 bg-card/20 hover:border-primary/40"
              }`}
            >
              <div
                className={`mb-6 flex h-28 items-end rounded-3xl bg-gradient-to-br ${avatar.accent} p-4`}
              >
                <div className="h-16 w-16 rounded-full border border-white/20 bg-black/20 backdrop-blur-xl" />
              </div>
              <div className="text-xl font-black uppercase tracking-tight">
                {avatar.title}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Sync this character to your profile and room presence.
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="rounded-full bg-primary px-8 py-4 text-primary-foreground text-[10px] font-black uppercase tracking-[0.35em] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Enter Metaverse"}
          </button>
          {status && <div className="text-sm text-amber-200">{status}</div>}
        </div>
      </div>
    </div>
  );
}
