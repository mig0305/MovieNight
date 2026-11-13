// The winner-scoring algorithm (the "beyond CRUD" feature).
//
// 1. Drop films over the night's runtime cap.
// 2. Drop films that anyone vetoed.
// 3. Score the rest from the ballots: 1st choice = 3, 2nd = 2, 3rd = 1.
// 4. Sort by points; break ties with the TMDB rating, then by title.
// 5. Explain why every film that didn't win lost.
//
// Pure function (no database), so it is easy to test on its own.

const POINTS = [3, 2, 1];
const pts = (n) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

/**
 * @param {number} maxRuntimeMin
 * @param {Array<{ id: string, title: string, runtime: number|null, voteAverage: number }>} suggestions
 * @param {Array<{ ranking: string[], veto: string|null }>} votes
 */
export function computeResult(maxRuntimeMin, suggestions, votes) {
  const points = new Map();
  const firstChoices = new Map();
  const vetoes = new Map();

  for (const vote of votes) {
    vote.ranking.slice(0, 3).forEach((id, i) => {
      points.set(id, (points.get(id) ?? 0) + POINTS[i]);
      if (i === 0) firstChoices.set(id, (firstChoices.get(id) ?? 0) + 1);
    });
    if (vote.veto) vetoes.set(vote.veto, (vetoes.get(vote.veto) ?? 0) + 1);
  }

  const rows = suggestions.map((s) => ({
    ...s,
    points: points.get(s.id) ?? 0,
    firstChoices: firstChoices.get(s.id) ?? 0,
    vetoes: vetoes.get(s.id) ?? 0,
  }));

  const overCap = [];
  const vetoed = [];
  const contenders = [];
  for (const row of rows) {
    if (row.runtime && row.runtime > maxRuntimeMin) {
      overCap.push({
        ...row, status: 'over_cap',
        reason: `Runs ${row.runtime} min, over the ${maxRuntimeMin}-min cap`,
      });
    } else if (row.vetoes > 0) {
      vetoed.push({
        ...row, status: 'vetoed',
        reason: `Vetoed by ${row.vetoes} ${row.vetoes === 1 ? 'person' : 'people'}`,
      });
    } else {
      contenders.push(row);
    }
  }

  contenders.sort((a, b) =>
    b.points - a.points
    || b.voteAverage - a.voteAverage
    || a.title.localeCompare(b.title));

  const winner = contenders[0] ?? null;
  const ranked = contenders.map((row, i) => {
    if (i === 0) {
      const next = contenders[1];
      let reason = `Most points (${pts(row.points)})`;
      if (next && next.points === row.points) {
        reason = next.voteAverage < row.voteAverage
          ? `Tied on ${pts(row.points)}, won on TMDB rating (${row.voteAverage.toFixed(1)})`
          : 'Tied on points and rating, won the alphabetical tiebreak';
      }
      return { ...row, status: 'winner', reason };
    }
    let reason;
    if (row.points < winner.points) {
      reason = `${pts(row.points)} vs the winner's ${pts(winner.points)}`;
    } else if (row.voteAverage < winner.voteAverage) {
      reason = `Tied on ${pts(row.points)}, lower TMDB rating `
        + `(${row.voteAverage.toFixed(1)} vs ${winner.voteAverage.toFixed(1)})`;
    } else {
      reason = 'Tied on points and rating, lost the alphabetical tiebreak';
    }
    return { ...row, status: 'runner_up', reason };
  });

  return {
    winner: ranked[0] ?? null,
    standings: [...ranked, ...vetoed, ...overCap],
    ballots: votes.length,
  };
}
