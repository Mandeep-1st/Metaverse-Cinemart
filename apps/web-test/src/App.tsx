import { useState } from "react";
// Import from the specific path where you saved the component
// Ensure your packages/ui/package.json exports allow this, or import via relative path if strictly mono-repo
import { TextGenerateEffect } from "@repo/ui/components/acternity/text-generate-effect";

function App() {
  const [count, setCount] = useState(0);

  const words = `Welcome to the Metaverse Cinemart. This text is animating using Framer Motion and your single-source Tailwind Theme.`;

  return (
    // 1. TEST: bg-background and text-foreground
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-10 space-y-10">
      {/* 2. TEST: Primary Color usage */}
      <h1 className="text-5xl font-bold text-primary">Theme Verification</h1>

      {/* 3. TEST: Card Styles */}
      <div className="w-full max-w-2xl bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border">
        <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
          Aceternity Component Test
        </h2>

        {/* 4. TEST: The Component */}
        <TextGenerateEffect words={words} />

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Interactive Count: {count}
          </button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        If you see this gray text, your 'muted' variables are working.
      </div>
    </div>
  );
}

export default App;
