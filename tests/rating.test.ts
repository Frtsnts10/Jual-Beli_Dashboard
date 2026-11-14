import { describe, expect, it } from "vitest";
import { ratingCounts, ratingDelta, ratingSummary } from "@/lib/rating";

describe("rating", () => {
  it("summarises star counts", () => {
    expect(ratingSummary(ratingCounts({ "5": 3, "4": 1 }))).toEqual({ count: 4, avg: 4.8 });
    expect(ratingSummary(ratingCounts(undefined))).toEqual({ count: 0, avg: 0 });
    expect(ratingCounts({ "5": -2, "3": 1.7, x: 9 })).toEqual({ "1": 0, "2": 0, "3": 1, "4": 0, "5": 0 });
  });

  it("only counts visible reviews when hiding, showing and editing", () => {
    expect(ratingDelta({ rating: 4, hidden: false }, { rating: 4, hidden: true })).toEqual({ "4": -1 });
    expect(ratingDelta({ rating: 4, hidden: true }, { rating: 4, hidden: false })).toEqual({ "4": 1 });
    expect(ratingDelta({ rating: 2, hidden: false }, { rating: 5, hidden: false })).toEqual({ "2": -1, "5": 1 });
    expect(ratingDelta({ rating: 3, hidden: false }, { rating: 3, hidden: false })).toEqual({});
    expect(ratingDelta(null, { rating: 1, hidden: false })).toEqual({ "1": 1 });
    expect(ratingDelta({ rating: 5, hidden: true }, null)).toEqual({});
  });
});
