import Navbar from "../components/home/Navbar";
import MovieHero from "../components/home/MovieHero";
import MovieCarousel from "../components/home/MovieCarousel";

const TRENDING_MOVIES = [
  { id: 1, title: "Dune: Part Two", rating: "8.9", year: "2024", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500&auto=format&fit=crop" },
  { id: 2, title: "Oppenheimer", rating: "8.4", year: "2023", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=500&auto=format&fit=crop" },
  { id: 3, title: "The Batman", rating: "7.8", year: "2022", img: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=500&auto=format&fit=crop" },
  { id: 4, title: "Interstellar", rating: "8.7", year: "2014", img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500&auto=format&fit=crop" },
  { id: 5, title: "Blade Runner", rating: "8.0", year: "2017", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop" },
  { id: 6, title: "Spider-Man", rating: "8.6", year: "2023", img: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=500&auto=format&fit=crop" },
  { id: 7, title: "The Joker", rating: "8.4", year: "2019", img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=500&auto=format&fit=crop" },
  { id: 8, title: "Avatar 2", rating: "7.5", year: "2022", img: "https://images.unsplash.com/photo-1501533530136-197496662dd6?q=80&w=500&auto=format&fit=crop" },
  { id: 9, title: "Gladiator", rating: "8.5", year: "2000", img: "https://images.unsplash.com/photo-1559584839-994c6f37f374?q=80&w=500&auto=format&fit=crop" },
  { id: 10, title: "Inception", rating: "8.8", year: "2010", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop" }
];

const TOP_RATED_MOVIES = [
  { id: 11, title: "The Matrix", rating: "8.7", year: "1999", img: "https://images.unsplash.com/photo-1626761191319-46513cdbe16f?q=80&w=500&auto=format&fit=crop" },
  { id: 12, title: "Top Gun", rating: "8.2", year: "2022", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500&auto=format&fit=crop" },
  { id: 13, title: "Whiplash", rating: "8.5", year: "2014", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop" },
  { id: 14, title: "Pulp Fiction", rating: "8.9", year: "1994", img: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop" },
  { id: 15, title: "The Prestige", rating: "8.5", year: "2006", img: "https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?q=80&w=500&auto=format&fit=crop" },
  { id: 16, title: "Seven", rating: "8.6", year: "1995", img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=500&auto=format&fit=crop" },
  { id: 17, title: "Fight Club", rating: "8.8", year: "1999", img: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=500&auto=format&fit=crop" },
  { id: 18, title: "Goodfellas", rating: "8.7", year: "1990", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=500&auto=format&fit=crop" },
  { id: 19, title: "The Revenant", rating: "8.0", year: "2015", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=500&auto=format&fit=crop" },
  { id: 20, title: "Parasite", rating: "8.5", year: "2019", img: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?q=80&w=500&auto=format&fit=crop" }
];

const Home = () => {
  return (
    /* ROOT: Added flex-col and overflow-x-hidden to prevent horizontal scrolling bugs */
    <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col font-sans antialiased">
      <Navbar />
      
      <main className="relative flex flex-col w-full">
        {/* HERO SECTION */}
        <section className="relative h-[85vh] md:h-[92vh] w-full overflow-hidden flex-shrink-0">
          <MovieHero />
          
          {/* THE SHADE: Fades into the dark background */}
          <div className="absolute inset-x-0 bottom-0 h-32 md:h-64 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
        </section>

        {/* CONTENT LAYER: Removed horizontal padding here so carousels can control their own padding and bleed to the edges */}
        <section className="relative z-20 -mt-16 md:-mt-24 pb-32 flex flex-col w-full">
          {/* Enforced items-start so components inside align to the left */}
          <div className="flex flex-col gap-20 md:gap-28 w-full items-start">
            <MovieCarousel 
              title="Now Trending" 
              category="trending" 
              movies={TRENDING_MOVIES} 
            />
            <MovieCarousel 
              title="Top Recommendations" 
              category="top_rated" 
              movies={TOP_RATED_MOVIES} 
            />
          </div>
        </section>
      </main>
      
      {/* Decorative Floor Glow: Uses primary color from global CSS */}
      <div className="fixed bottom-0 w-full h-px bg-primary shadow-2xl opacity-20 pointer-events-none z-50" />
    </div>
  );
};

export default Home;