import { MovieModel } from "../models/movies.model";
import { InvertedGenreModel, InvertedCastModel, InvertedDirectorModel } from "../models/invertedIndex.model";

export class SeederService {
    static async seedTestMovies(count: number = 200) {
        console.log(`Starting test data seeding (${count} movies)...`);

        // Test Genres (same as TMDB genre IDs)
        const genres = [
            { id: 28, name: "Action" },
            { id: 12, name: "Adventure" },
            { id: 16, name: "Animation" },
            { id: 35, name: "Comedy" },
            { id: 80, name: "Crime" },
            { id: 18, name: "Drama" },
            { id: 14, name: "Fantasy" },
            { id: 27, name: "Horror" },
            { id: 10749, name: "Romance" },
            { id: 878, name: "Science Fiction" },
            { id: 53, name: "Thriller" },
            { id: 10752, name: "War" },
            { id: 99, name: "Documentary" },
            { id: 10402, name: "Music" },
            { id: 9648, name: "Mystery" },
            { id: 37, name: "Western" }
        ];

        // Expanded Cast Members (25 actors)
        const castMembers = [
            { id: 1001, name: "Tom Hanks" },
            { id: 1002, name: "Leonardo DiCaprio" },
            { id: 1003, name: "Scarlett Johansson" },
            { id: 1004, name: "Robert Downey Jr." },
            { id: 1005, name: "Chris Evans" },
            { id: 1006, name: "Emma Stone" },
            { id: 1007, name: "Ryan Gosling" },
            { id: 1008, name: "Margot Robbie" },
            { id: 1009, name: "Brad Pitt" },
            { id: 1010, name: "Cate Blanchett" },
            { id: 1011, name: "Denzel Washington" },
            { id: 1012, name: "Meryl Streep" },
            { id: 1013, name: "Christian Bale" },
            { id: 1014, name: "Natalie Portman" },
            { id: 1015, name: "Tom Cruise" },
            { id: 1016, name: "Jennifer Lawrence" },
            { id: 1017, name: "Morgan Freeman" },
            { id: 1018, name: "Anne Hathaway" },
            { id: 1019, name: "Matt Damon" },
            { id: 1020, name: "Charlize Theron" },
            { id: 1021, name: "Will Smith" },
            { id: 1022, name: "Viola Davis" },
            { id: 1023, name: "Joaquin Phoenix" },
            { id: 1024, name: "Amy Adams" },
            { id: 1025, name: "Samuel L. Jackson" }
        ];

        // Expanded Directors (15 directors)
        const directors = [
            { id: 2001, name: "Christopher Nolan" },
            { id: 2002, name: "Steven Spielberg" },
            { id: 2003, name: "Martin Scorsese" },
            { id: 2004, name: "Quentin Tarantino" },
            { id: 2005, name: "Denis Villeneuve" },
            { id: 2006, name: "Greta Gerwig" },
            { id: 2007, name: "James Cameron" },
            { id: 2008, name: "Ridley Scott" },
            { id: 2009, name: "David Fincher" },
            { id: 2010, name: "Wes Anderson" },
            { id: 2011, name: "Jordan Peele" },
            { id: 2012, name: "Damien Chazelle" },
            { id: 2013, name: "Ava DuVernay" },
            { id: 2014, name: "Bong Joon-ho" },
            { id: 2015, name: "Chloe Zhao" }
        ];

        // Movie title templates for variety
        const titleTemplates = [
            "The Last {0}", "Beyond the {0}", "{0} Rising", "Shadow of {0}",
            "The {0} Chronicles", "{0}'s Legacy", "Eternal {0}", "The {0} Code",
            "Dark {0}", "Project {0}", "Operation {0}", "The {0} Effect",
            "{0} Unleashed", "Behind the {0}", "The Secret of {0}", "Midnight {0}"
        ];
        const titleWords = [
            "Storm", "Phoenix", "Dragon", "Empire", "Dawn", "Knight", "Star", "Thunder",
            "Shadow", "Flame", "Crystal", "Ocean", "Mountain", "Destiny", "Legacy", "Horizon"
        ];

        // Generate movies
        const movies: any[] = [];
        for (let i = 1; i <= count; i++) {
            // Randomly assign 2-4 genres
            const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
            const movieGenres = shuffledGenres.slice(0, 2 + Math.floor(Math.random() * 3));

            // Randomly assign 4-7 cast members
            const shuffledCast = [...castMembers].sort(() => Math.random() - 0.5);
            const movieCast = shuffledCast
                .slice(0, 4 + Math.floor(Math.random() * 4))
                .map((actor, index) => ({
                    id: actor.id,
                    name: actor.name,
                    character: `Character ${index + 1}`,
                    order: index
                }));

            // Randomly assign 1-2 directors
            const shuffledDirectors = [...directors].sort(() => Math.random() - 0.5);
            const movieDirectors = shuffledDirectors
                .slice(0, 1 + Math.floor(Math.random() * 2))
                .map(d => ({
                    id: d.id,
                    name: d.name,
                    job: "Director",
                    department: "Directing",
                    profile_path: "https://via.placeholder.com/150"
                }));

            // Generate varied movie title
            const template = titleTemplates[i % titleTemplates.length]!;
            const word = titleWords[(i * 7) % titleWords.length]!;
            const movieTitle = template.replace("{0}", word) + (i > 16 ? ` ${Math.ceil(i / 16)}` : "");

            movies.push({
                tmdb_id: 100000 + i,
                title: movieTitle,
                overview: `An exciting ${movieGenres[0]?.name || 'Drama'} film featuring ${movieCast[0]?.name || 'great actors'}. Directed by ${movieDirectors[0]?.name || 'a renowned director'}. Movie #${i} in our test collection.`,
                images: {
                    poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(movieTitle)}`,
                    backdrop: `https://via.placeholder.com/1280x720?text=${encodeURIComponent(movieTitle)}`
                },
                genres: movieGenres,
                keywords: [],
                credits: {
                    cast: movieCast,
                    crew: movieDirectors
                },
                details: {
                    runtime: 90 + Math.floor(Math.random() * 60),
                    release_date: new Date(2018 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
                    status: "Released",
                    original_language: "en"
                },
                metrics: {
                    popularity: 10 + Math.random() * 90,
                    vote_average: 5 + Math.random() * 5,
                    vote_count: 100 + Math.floor(Math.random() * 10000)
                }
            });
        }

        // Insert movies using bulkWrite (more efficient than insertMany for duplicates handling if we switched to it, 
        // but insertMany with ordered:false is fine too for simple inserts)
        await MovieModel.insertMany(movies, { ordered: false }).catch(err => {
            console.log("Some movies may already exist, continuing...");
        });
        console.log(`Inserted ${movies.length} test movies.`);

        // Build inverted indexes using bulkWrite
        const genreOps: any[] = [];
        const castOps: any[] = [];
        const directorOps: any[] = [];

        for (const movie of movies) {
            // Genre index operations
            for (const genre of movie.genres) {
                genreOps.push({
                    updateOne: {
                        filter: { _id: genre.id },
                        update: { $setOnInsert: { name: genre.name }, $addToSet: { movies: movie.tmdb_id } },
                        upsert: true
                    }
                });
            }

            // Cast index operations
            for (const actor of movie.credits.cast) {
                castOps.push({
                    updateOne: {
                        filter: { _id: actor.id },
                        update: { $setOnInsert: { name: actor.name }, $addToSet: { movies: movie.tmdb_id } },
                        upsert: true
                    }
                });
            }

            // Director index operations
            for (const director of movie.credits.crew) {
                directorOps.push({
                    updateOne: {
                        filter: { _id: director.id },
                        update: { $setOnInsert: { name: director.name }, $addToSet: { movies: movie.tmdb_id } },
                        upsert: true
                    }
                });
            }
        }

        if (genreOps.length > 0) await InvertedGenreModel.bulkWrite(genreOps);
        if (castOps.length > 0) await InvertedCastModel.bulkWrite(castOps);
        if (directorOps.length > 0) await InvertedDirectorModel.bulkWrite(directorOps);

        console.log("Inverted indexes updated.");

        return {
            moviesCount: movies.length,
            genresCount: genres.length,
            castCount: castMembers.length,
            directorsCount: directors.length
        };
    }
}
