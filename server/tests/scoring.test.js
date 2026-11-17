// Unit tests for the winner algorithm. computeResult() is a pure function,
// so these tests need no database, no server and no TMDB token.
import { describe, it, expect } from 'vitest';
import { computeResult } from '../utils/scoring.js';

const film = (id, title, runtime, voteAverage) => ({
  id,
  tmdbId: Number(id.replace(/\D/g, '')) || 1,
  title,
  posterPath: null,
  runtime,
  voteAverage,
});

describe('computeResult', () => {
  it('awards 3/2/1 points and picks the highest total', () => {
    const result = computeResult(
      150,
      [film('a1', 'Alpha', 100, 7), film('b2', 'Beta', 100, 7), film('c3', 'Gamma', 100, 7)],
      [
        { ranking: ['a1', 'b2', 'c3'], veto: null }, // a+3 b+2 c+1
        { ranking: ['b2', 'a1', 'c3'], veto: null }, // b+3 a+2 c+1
        { ranking: ['a1', 'c3', 'b2'], veto: null }, // a+3 c+2 b+1
      ],
    );

    expect(result.winner.title).toBe('Alpha');
    expect(result.winner.points).toBe(8);
    expect(result.ballots).toBe(3);
    expect(result.standings.map((s) => s.status)).toEqual(['winner', 'runner_up', 'runner_up']);
  });

  it('a vetoed film cannot win, even with the most points', () => {
    const result = computeResult(
      150,
      [film('a1', 'Alpha', 100, 9), film('b2', 'Beta', 100, 6), film('c3', 'Gamma', 100, 6), film('d4', 'Delta', 100, 6)],
      [
        { ranking: ['a1', 'b2', 'c3'], veto: null },
        { ranking: ['a1', 'c3', 'b2'], veto: null },
        { ranking: ['b2', 'c3', 'd4'], veto: 'a1' },
      ],
    );

    expect(result.winner.title).not.toBe('Alpha');
    const alpha = result.standings.find((s) => s.title === 'Alpha');
    expect(alpha.status).toBe('vetoed');
    expect(alpha.reason).toBe('Vetoed by 1 person');
  });

  it('breaks a points tie with the higher TMDB rating', () => {
    const result = computeResult(
      150,
      [film('a1', 'Alpha', 100, 6.5), film('b2', 'Beta', 100, 8.1), film('c3', 'Gamma', 100, 5)],
      [
        { ranking: ['a1', 'b2', 'c3'], veto: null },
        { ranking: ['b2', 'a1', 'c3'], veto: null },
      ],
    );

    expect(result.winner.title).toBe('Beta');
    expect(result.winner.reason).toMatch(/won on TMDB rating/);
  });

  it('returns no winner when every film is vetoed', () => {
    const result = computeResult(
      150,
      [film('a1', 'Alpha', 100, 7), film('b2', 'Beta', 100, 7)],
      [
        { ranking: [], veto: 'a1' },
        { ranking: [], veto: 'b2' },
      ],
    );

    expect(result.winner).toBeNull();
    expect(result.standings.every((s) => s.status === 'vetoed')).toBe(true);
  });
});