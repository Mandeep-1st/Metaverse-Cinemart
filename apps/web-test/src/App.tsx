import { useState } from "react";
import { motion } from "framer-motion"; // Make sure to import motion if you use it in children
import { TextGenerateEffect } from "@repo/ui/components/acternity/text-generate-effect";
import { LampContainer } from "@repo/ui/components/acternity/lamp";

function App() {
  const [count, setCount] = useState(0);

  const words = `Welcome to the Metaverse Cinemart. This text is animating using Framer Motion and your single-source Tailwind Theme.`;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center">
      
      {/* 1. New Lamp Section */}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          Build Lamps <br /> the right way
        </motion.h1>
      </LampContainer>

      {/* 2. Previous Content (Text Effect) */}
      <div className="w-full max-w-2xl p-10 space-y-10">
        <h1 className="text-5xl font-bold text-primary text-center">Theme Verification</h1>
        
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border">
          <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
            Aceternity Component Test
          </h2>
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
      </div>

    </div>
  );
}

export default App;