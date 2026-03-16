import { useState, useEffect } from 'react';

// Actual 32-character TMDB v3 API Key
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMDE4ZTJkYzhlN2Y4NDkwOGE4NjM0NjkyM2QwMjAzMyIsIm5iZiI6MTc2OTcyNjIxNi4zMjYwMDAyLCJzdWIiOiI2OTdiZTEwODEwOTgzOTk3YmYyYTMxOTkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.J1Y7fClU2HMLWbOeKGNBM-kLcFty7gA9KE6P9jiRIKE'; 
const BASE_URL = 'https://api.themoviedb.org/3';

export const useTmdb = (category: string) => {
  const [movieLibrary, setMovieLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_KEY || API_KEY === 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMDE4ZTJkYzhlN2Y4NDkwOGE4NjM0NjkyM2QwMjAzMyIsIm5iZiI6MTc2OTcyNjIxNi4zMjYwMDAyLCJzdWIiOiI2OTdiZTEwODEwOTgzOTk3YmYyYTMxOTkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.J1Y7fClU2HMLWbOeKGNBM-kLcFty7gA9KE6P9jiRIKE') {
      console.warn("CineSmart Engine: Missing TMDB API Key. Please update useTmdb.ts.");
      return;
    }

    const fetchLargeLibrary = async () => {
      setLoading(true);
      try {
        const endpoints = {
          trending: '/trending/movie/week',
          top_rated: '/movie/top_rated'
        };
        const path = endpoints[category as keyof typeof endpoints] || endpoints.trending;
        
        // Fetch 10 pages simultaneously to reach 200 movies
        const pagePromises = Array.from({ length: 10 }, (_, i) =>
          fetch(`${BASE_URL}${path}?api_key=${API_KEY}&page=${i + 1}`)
            .then((res) => {
              // Fix for common console errors: check if the response is actually valid
              if (!res.ok) {
                throw new Error(`Status ${res.status}: Invalid API Key or Network Issue`);
              }
              return res.json();
            })
            .catch((err) => {
              console.error(`Page ${i + 1} Fetch Failed:`, err.message);
              return { results: [] }; // Prevent the whole library from failing
            })
        );

        const results = await Promise.all(pagePromises);
        
        // Combine results and filter out any undefined data
        const flattened = results.flatMap(data => data.results || []);
        
        setMovieLibrary(flattened);
      } catch (error) {
        console.error("CineSmart Engine Critical Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLargeLibrary();
  }, [category]);

  return { movieLibrary, loading };
};