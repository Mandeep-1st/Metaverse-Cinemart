export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="dark min-h-screen w-full bg-background text-foreground flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center gap-6">
        <div className="absolute h-48 w-48 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative h-20 w-20 rounded-full border border-primary/20 bg-card/30 backdrop-blur-xl flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <div className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">
            CineSmart
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {label || "Loading your cinema session..."}
          </div>
        </div>
      </div>
    </div>
  );
}
