import { expect, test } from "vitest";
import { calculateNightResults } from "./calculateResults";

test("Calculates scores, vetoes, and tie-breaks", () => {

    const night = {
        id: "night-1",
        maxRuntimeMin: 120,
        memberEmails: [
            "alex@example.com",
            "sara@example.com"
        ]
    };

    const suggestions = [
        {
            id: "a",
            nightId: "night-1",
            tmdbId: 1,
            title: "Movie A",
            runtime: 100,
            voteAverage: 8.2
        },
        {
            id: "b",
            nightId: "night-1",
            tmdbId: 2,
            title: "Movie B",
            runtime: 110,
            voteAverage: 8.7
        },
        {
            id: "c",
            nightId: "night-1",
            tmdbId: 3,
            title: "Movie C",
            runtime: 90,
            voteAverage: 7.5
        },
        {
            id: "d",
            nightId: "night-1",
            tmdbId: 4,
            title: "Movie D",
            runtime: 150,
            voteAverage: 9.0
        }
    ];

    const votes = [
        {
            nightId: "night-1",
            userEmail: "alex@example.com",
            rankedIds: ["a", "b", "c"],
            vetoId: "d"
        },
        {
            nightId: "night-1",
            userEmail: "sara@example.com",
            rankedIds: ["b", "a", "c"],
            vetoId: "d"
        }
    ];

    const result = calculateNightResults(
        night,
        suggestions,
        votes
    );

    // A and B each earn 5 points.
    // B wins because of its higher TMDB rating.
    expect(result.winner.title).toBe("Movie B");
    expect(result.winner.points).toBe(5);

    // D exceeds the runtime cap and received vetoes.
    expect(result.excluded.length).toBe(1);
    expect(result.excluded[0].title).toBe("Movie D");

    expect(result.excluded[0].reason).toContain(
        "Vetoed"
    );
});
