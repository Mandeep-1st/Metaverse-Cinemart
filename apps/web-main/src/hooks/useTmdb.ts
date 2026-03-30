import { useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export const useTmdb = (category: string) => {
  const [movieLibrary, setMovieLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLibrary = async () => {
      setLoading(true);
      try {
        const response = await apiGet<ApiResponse<any[]>>("/movies/discover", {
          category,
        });

        if (!cancelled) {
          setMovieLibrary(response.data);
        }
      } catch {
        if (!cancelled) {
          setMovieLibrary([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLibrary();

    return () => {
      cancelled = true;
    };
  }, [category]);

  return { movieLibrary, loading };
};
