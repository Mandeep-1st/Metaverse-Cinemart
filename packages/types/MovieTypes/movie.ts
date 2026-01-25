export interface Movie {
    tmdbId: string;
    title: string;
    trailerKey: string;
    cast: { name: string; character: string }[];
}

