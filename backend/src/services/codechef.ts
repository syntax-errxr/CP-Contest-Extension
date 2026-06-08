import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CodeChefProfile {
  rating: number;
  stars?: string;
  global_rank?: number;
}

export interface CodeChefHistoryItem {
  code: string;
  name: string;
  end_date: string;
  rating: string;
  rank: string;
}

export interface CodeChefContest {
  id: string;
  name: string;
  platform: string;
  start_time: Date;
  duration_seconds: number;
  url: string;
  status: string;
}

export class CodeChefService {
  private static BASE_URL = 'https://www.codechef.com';
  private static HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  public static async fetchUserRating(username: string): Promise<CodeChefProfile | null> {
    try {
      const url = `${this.BASE_URL}/users/${username}`;
      const response = await axios.get(url, {
        headers: this.HEADERS,
        timeout: 12000,
        // axios redirects automatically by default, but let's make it explicit
        maxRedirects: 5,
      });

      if (response.status !== 200) return null;

      const $ = cheerio.load(response.data);

      // 1. Parse current rating
      const ratingText = $('.rating-number').first().text().trim();
      const rating = ratingText && ratingText !== 'NA' ? parseInt(ratingText, 10) : null;

      if (rating === null || isNaN(rating)) return null;

      // 2. Parse stars from rating-star container
      let stars: string | undefined;
      const starElem = $('.rating-star').first();
      if (starElem.length > 0) {
        // Cheerio decodes entities like &#9733; to Unicode star glyphs (★)
        const starsText = starElem.text().trim();
        const starCount = (starsText.match(/★/g) || []).length || starElem.find('span').length;
        if (starCount > 0) {
          stars = `${starCount}★`;
        }
      }

      // 3. Parse global rank (li containing text "Global Rank" with <strong> child)
      let globalRank: number | undefined;
      $('li').each((_, elem) => {
        const text = $(elem).text();
        if (text.includes('Global Rank')) {
          const rankVal = $(elem).find('strong').text().trim();
          if (rankVal && rankVal !== 'Inactive' && !isNaN(Number(rankVal))) {
            globalRank = parseInt(rankVal, 10);
          }
        }
      });

      return {
        rating,
        stars,
        global_rank: globalRank,
      };
    } catch (error: any) {
      console.error(`Error fetching CodeChef stats for ${username}:`, error.message);
    }
    return null;
  }

  public static async fetchUserContestHistory(username: string): Promise<CodeChefHistoryItem[]> {
    try {
      const url = `${this.BASE_URL}/users/${username}`;
      const response = await axios.get(url, {
        headers: this.HEADERS,
        timeout: 12000,
        maxRedirects: 5,
      });

      if (response.status !== 200) return [];

      const $ = cheerio.load(response.data);
      let history: CodeChefHistoryItem[] = [];

      $('script').each((_, elem) => {
        const scriptText = $(elem).html() || '';
        if (scriptText.includes('all_rating')) {
          const match = scriptText.match(/var\s+all_rating\s*=\s*(\[.*?\]);/s);
          if (match) {
            try {
              const jsonStr = match[1];
              if (jsonStr) {
                history = JSON.parse(jsonStr);
              }
            } catch (e: any) {
              console.error('Failed to parse CodeChef history JSON:', e.message);
            }
          }
        }
      });

      return history;
    } catch (error: any) {
      console.error(`Error fetching CodeChef history for ${username}:`, error.message);
    }
    return [];
  }

  public static async fetchUpcomingContests(): Promise<CodeChefContest[]> {
    try {
      const url = `${this.BASE_URL}/api/list/contests/all?sort_by=START&sorting_order=asc`;
      const response = await axios.get(url, { headers: this.HEADERS, timeout: 10000 });
      if (response.status !== 200) return [];

      const data = response.data;
      const upcoming: CodeChefContest[] = [];

      // API returns future contests under 'future_contests'
      const futureContests = data.future_contests || [];
      for (const contest of futureContests) {
        const start_time_str = contest.contest_start_date;
        if (!start_time_str) continue;

        // Parse date. E.g. "19 Jun 2024 20:00:00" or "2024-06-19 20:00:00"
        let start_time = new Date(start_time_str);
        if (isNaN(start_time.getTime())) {
          // Fallback if parsing fails (replacing spaces for standard ISO)
          start_time = new Date(start_time_str.replace(' ', 'T'));
        }
        if (isNaN(start_time.getTime())) continue;

        const durationMinutes = parseInt(contest.contest_duration || '0', 10);
        const duration_seconds = durationMinutes * 60;

        upcoming.push({
          id: `codechef-${contest.contest_code}`,
          name: contest.contest_name || `Starters ${contest.contest_code}`,
          platform: 'codechef',
          start_time,
          duration_seconds,
          url: `${this.BASE_URL}/${contest.contest_code}`,
          status: 'upcoming',
        });
      }

      return upcoming;
    } catch (error: any) {
      console.error('Error fetching CodeChef upcoming contests:', error.message);
    }
    return [];
  }
}
