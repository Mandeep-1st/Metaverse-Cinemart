import type { Movie } from "@repo/types";
import { useState } from "react";

const THEMES = [
  "tangerine",
  "brutalist",
  "soft-pop",
  "bubblegum",
  "grove",
  "elegant",
  "vintage",
];

export default function App() {
  const [currentTheme, setCurrentTheme] = useState("tangerine");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [movie] = useState<Movie>({
    tmdbId: "test-1",
    title: "Turborepo Test",
    trailerKey: "abc",
    cast: [],
  });

  const changeTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme-preset", theme);
    setCurrentTheme(theme);
    setShowThemeMenu(false);
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Theme Switcher - Floating */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span>🎨</span>
            <span className="capitalize">{currentTheme}</span>
            <span className="text-xs">▼</span>
          </button>

          {showThemeMenu && (
            <div className="absolute top-full right-0 mt-2 bg-background border-2 border-primary rounded-lg shadow-xl overflow-hidden min-w-[160px]">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => changeTheme(theme)}
                  className={`w-full px-4 py-2 text-left hover:bg-primary hover:text-white transition-colors capitalize ${
                    currentTheme === theme
                      ? "bg-primary text-white font-bold"
                      : ""
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Header Section */}
        <header className="mb-12">
          <h1 className="text-6xl font-black text-primary uppercase italic mb-2">
            {movie.title}
          </h1>
          <p className="text-xl text-foreground/70">Theme Testing Dashboard</p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 - Movie Info */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Movie Details
            </h3>
            <div className="space-y-2">
              <p className="text-foreground">
                <span className="font-semibold">TMDB ID:</span> {movie.tmdbId}
              </p>
              <p className="text-foreground">
                <span className="font-semibold">Trailer:</span>{" "}
                {movie.trailerKey}
              </p>
              <p className="text-foreground">
                <span className="font-semibold">Cast:</span> {movie.cast.length}{" "}
                members
              </p>
            </div>
          </div>

          {/* Card 2 - Buttons */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">Buttons</h3>
            <div className="space-y-3">
              <button className="w-full bg-primary text-white px-4 py-2 rounded font-bold hover:opacity-90">
                Primary Button
              </button>
              <button className="w-full border-2 border-primary text-primary px-4 py-2 rounded font-bold hover:bg-primary hover:text-white transition-colors">
                Secondary Button
              </button>
              <button className="w-full bg-surface text-foreground px-4 py-2 rounded border border-foreground/30 hover:border-primary transition-colors">
                Tertiary Button
              </button>
            </div>
          </div>

          {/* Card 3 - Form Elements */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Form Elements
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text Input"
                className="w-full px-3 py-2 border-2 border-primary rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select className="w-full px-3 py-2 border-2 border-primary rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-foreground">Checkbox Option</span>
              </label>
            </div>
          </div>

          {/* Card 4 - Typography */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">Typography</h3>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground">Heading 1</h1>
              <h2 className="text-2xl font-bold text-foreground">Heading 2</h2>
              <h3 className="text-xl font-semibold text-foreground">
                Heading 3
              </h3>
              <p className="text-foreground">
                Regular paragraph text with normal weight.
              </p>
              <p className="text-foreground/70 text-sm">
                Muted text for secondary information.
              </p>
            </div>
          </div>

          {/* Card 5 - Status Badges */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Status Badges
            </h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
                <span className="bg-background text-foreground px-3 py-1 rounded-full text-sm border-2 border-primary">
                  Pending
                </span>
                <span className="bg-surface text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary">
                  Featured
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-primary font-bold">★★★★☆</span>
                <span className="text-foreground/50">4.0/5.0</span>
              </div>
            </div>
          </div>

          {/* Card 6 - Progress & Loading */}
          <div className="bg-surface border-2 border-primary rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-primary mb-4">Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Loading...</span>
                  <span className="text-primary font-semibold">75%</span>
                </div>
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-primary">
                  <div className="h-full bg-primary w-3/4 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-foreground">Spinner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Card */}
        <div className="bg-surface border-2 border-primary rounded-lg p-8 shadow-lg">
          <h3 className="text-3xl font-black text-primary mb-6 uppercase italic">
            Full Width Content Area
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xl font-bold text-foreground mb-3">
                Left Column
              </h4>
              <p className="text-foreground mb-3">
                This is a comprehensive theme testing dashboard. It includes
                various UI components to help you visualize how different theme
                presets affect the overall design.
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Background and surface colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Primary accent colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Typography and text colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Interactive elements</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold text-foreground mb-3">
                Right Column
              </h4>
              <div className="bg-background border border-primary rounded p-4 mb-3">
                <p className="text-foreground/80 text-sm italic">
                  "Use the floating theme switcher in the top-right corner to
                  quickly test different presets."
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Theme Count:</span>
                  <span className="text-primary font-bold">
                    {THEMES.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Current Theme:</span>
                  <span className="text-primary font-bold capitalize">
                    {currentTheme}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
