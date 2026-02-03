import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { TextGenerateEffect } from "@repo/ui/components/acternity/text-generate-effect";
import { LampContainer } from "@repo/ui/components/acternity/lamp";
import { motion } from "framer-motion";

export default function App() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    // Standard block layout, no flex-center hacks on body
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* 1. Lamp Section: Standard Aceternity Usage */}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          Metaverse Design
        </motion.h1>

        {/* Pass text-white explicitly because Lamp is dark */}
        <div className="mt-4">
          <TextGenerateEffect
            words="One Theme Infinite Possibilities Ready for Launch"
            className="text-white"
          />
        </div>
      </LampContainer>

      {/* 2. Content Section: Basic Container */}
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div className="flex justify-center">
          <Button onClick={toggleDarkMode} variant="outline">
            Toggle Dark Mode
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shadcn Card</CardTitle>
            </CardHeader>
            <CardContent>This is a standard component.</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Standard Button</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
