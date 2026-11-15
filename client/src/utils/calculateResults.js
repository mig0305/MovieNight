export function calculateNightResults(night, suggestions, votes) {

    // 1. Get suggestions and ballots for this night
    const movies = suggestions.filter(
        (s) => s.nightId === night.id
    );

    const ballots = votes.filter(
        (v) =>
            v.nightId === night.id &&
            night.memberEmails.includes(v.userEmail)
    );

    // 2. Calculate points and vetoes for each movie
    const scoredMovies = movies.map((movie) => {
        let points = 0;
        let vetoCount = 0;

        ballots.forEach((ballot) => {

            const position = ballot.rankedIds.indexOf(movie.id);

            if (position !== -1) {
                points += 3 - position;
            }

            if (ballot.vetoId === movie.id) {
                vetoCount++;
            }
        });

        // 3. Check why a movie might be excluded
        const reasons = [];

        if (
            !Number.isInteger(movie.runtime) ||
            movie.runtime <= 0
        ) {
            reasons.push("Runtime is unavailable or invalid.");
        } else if (movie.runtime > night.maxRuntimeMin) {
            reasons.push(
                `Runtime of ${movie.runtime} minutes exceeds ` +
                `the ${night.maxRuntimeMin}-minute limit.`
            );
        }

        if (vetoCount > 0) {
            reasons.push(
                `Vetoed by ${vetoCount} member(s).`
            );
        }

        return {
            ...movie,
            points: points,
            vetoCount: vetoCount,
            excludedReason: reasons.join(" ")
        };
    });

    // 4. Keep eligible movies only
    const eligible = scoredMovies.filter(
        (movie) => movie.excludedReason === ""
    );

    // 5. Sort by points, then TMDB rating
    eligible.sort((a, b) => {

        if (b.points !== a.points) {
            return b.points - a.points;
        }

        const ratingA = Number(a.voteAverage) || 0;
        const ratingB = Number(b.voteAverage) || 0;

        if (ratingB !== ratingA) {
            return ratingB - ratingA;
        }

        // Final tie-break for identical ratings
        return Number(a.tmdbId) - Number(b.tmdbId);
    });

    // 6. Determine the winner
    const winner = eligible.length > 0
        ? eligible[0]
        : null;

    // 7. Explain why the winning movie won
    let winnerReason = "";

    if (winner) {
        const secondPlace = eligible[1];

        if (!secondPlace || winner.points > secondPlace.points) {
            winnerReason =
                `Highest eligible score: ${winner.points} points.`;
        } else if (winner.voteAverage > secondPlace.voteAverage) {
            winnerReason =
                `Tied at ${winner.points} points, but won ` +
                `with a higher TMDB rating.`;
        } else {
            winnerReason =
                "Tied on points and TMDB rating. " +
                "The lower TMDB ID broke the tie.";
        }
    }

    // 8. Explain why each runner-up lost
    const runnersUp = eligible.slice(1).map((movie) => {
        let reason = "";

        if (movie.points < winner.points) {
            reason =
                `Earned ${movie.points} points, ` +
                `${winner.points - movie.points} fewer than the winner.`;
        } else if (movie.voteAverage < winner.voteAverage) {
            reason =
                `Tied with ${winner.points} points, but had ` +
                `a lower TMDB rating.`;
        } else {
            reason =
                "Tied on points and TMDB rating, but lost " +
                "the final TMDB ID tie-break.";
        }

        return {
            ...movie,
            reason: reason
        };
    });

    // 9. List movies excluded by veto or runtime
    const excluded = scoredMovies
        .filter((movie) => movie.excludedReason !== "")
        .map((movie) => ({
            ...movie,
            reason: movie.excludedReason
        }));

    // 10. Return the full result
    return {
        winner: winner
            ? { ...winner, reason: winnerReason }
            : null,
        runnersUp: runnersUp,
        excluded: excluded,
        ballotCount: ballots.length,
        memberCount: night.memberEmails.length
    };
}
