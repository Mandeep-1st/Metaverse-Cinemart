import * as React from "react";
import { BrainCircuit, Clapperboard, Sparkles, WandSparkles } from "lucide-react";
import { cn } from "../lib/utils";

export type AiModeId = "suggest" | "context" | "chat";

type AiMessage = {
  role: "user" | "ai";
  content: string;
};

type AiModePanelProps = {
  title: string;
  subtitle: string;
  selectedMode: AiModeId | null;
  onSelectMode: (mode: AiModeId) => void;
  messages: AiMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  status?: string;
  className?: string;
};

const optionConfig: Array<{
  id: AiModeId;
  label: string;
  description: string;
  promptHint: string;
  accent: string;
  icon: React.ReactNode;
}> = [
  {
    id: "suggest",
    label: "Suggest another movie like this",
    description:
      "Get one focused recommendation based on what you liked or disliked about the current movie.",
    promptHint: "Example: I loved the slow-burn tension and layered characters.",
    accent: "from-[#f4b63d]/30 to-red-500/10",
    icon: <WandSparkles className="h-5 w-5" />,
  },
  {
    id: "context",
    label: "What about this movie?",
    description:
      "Ask contextual questions about the current movie, its plot, cast, or direction.",
    promptHint: "Example: Why is the ending so divisive?",
    accent: "from-sky-500/20 to-cyan-400/10",
    icon: <Clapperboard className="h-5 w-5" />,
  },
  {
    id: "chat",
    label: "Simple chat",
    description:
      "Have a general conversation that can still stay around films and recommendations.",
    promptHint: "Example: Recommend a great sci-fi double feature.",
    accent: "from-emerald-500/20 to-lime-400/10",
    icon: <BrainCircuit className="h-5 w-5" />,
  },
];

export function AiModePanel({
  title,
  subtitle,
  selectedMode,
  onSelectMode,
  messages,
  input,
  onInputChange,
  onSubmit,
  loading = false,
  status = "",
  className,
}: AiModePanelProps) {
  const activeOption = optionConfig.find((option) => option.id === selectedMode);

  return (
    <div
      className={cn(
        "rounded-[36px] border border-white/10 bg-black/35 p-6 text-white backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#f4b63d]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Assistant
          </div>
          <h2 className="mt-3 text-3xl font-black italic tracking-tight md:text-5xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
            {subtitle}
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
          Pick a mode first
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {optionConfig.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelectMode(option.id)}
            className={cn(
              "rounded-[28px] border p-5 text-left transition-all",
              `bg-gradient-to-br ${option.accent}`,
              selectedMode === option.id
                ? "border-[#f4b63d]/70 shadow-[0_24px_80px_rgba(244,182,61,0.12)]"
                : "border-white/10 hover:border-white/25",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-[#f4b63d]">
                {option.icon}
              </div>
              {selectedMode === option.id && (
                <div className="rounded-full border border-[#f4b63d]/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4b63d]">
                  Selected
                </div>
              )}
            </div>
            <div className="mt-5 text-xl font-black text-white">{option.label}</div>
            <p className="mt-3 text-sm leading-7 text-white/65">
              {option.description}
            </p>
            <div className="mt-4 text-xs text-white/45">{option.promptHint}</div>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] transition-all duration-300",
          selectedMode ? "max-h-[1200px] opacity-100" : "max-h-[0px] opacity-0",
        )}
      >
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
              Conversation
            </div>
            <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-2">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "rounded-[24px] border p-4",
                    message.role === "ai"
                      ? "border-[#f4b63d]/20 bg-[#f4b63d]/5"
                      : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f4b63d]">
                    {message.role === "ai" ? "CineBot" : "You"}
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
              Prompt
            </div>
            <div className="mt-3 text-xl font-black text-white">
              {activeOption?.label || "Choose a mode"}
            </div>
            <div className="mt-2 text-sm leading-7 text-white/60">
              {activeOption?.description ||
                "Select one of the three AI behaviors before sending a message."}
            </div>

            <textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              rows={7}
              placeholder={activeOption?.promptHint || "Choose a mode first"}
              disabled={!selectedMode || loading}
              className="mt-5 w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              onClick={onSubmit}
              disabled={!selectedMode || loading || !input.trim()}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#f4b63d] px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-black disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send to AI"}
            </button>

            {status && (
              <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
