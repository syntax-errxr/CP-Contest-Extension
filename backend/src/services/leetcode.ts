import axios from 'axios';

export interface LeetCodeTopic {
  topic: string;
  solved_count: number;
}

export interface LeetCodeHistoryItem {
  attended: boolean;
  rating: number;
  ranking: number;
  contest: {
    title: string;
    startTime: number;
  };
}

export class LeetCodeService {
  private static GRAPHQL_URL = 'https://leetcode.com/graphql';
  private static HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  private static async makeGraphQLRequest(query: string, variables: Record<string, any>) {
    try {
      const response = await axios.post(
        this.GRAPHQL_URL,
        { query, variables },
        { headers: this.HEADERS, timeout: 12000 }
      );
      return response.data?.data || null;
    } catch (error: any) {
      console.error('LeetCode GraphQL request failed:', error.message);
      return null;
    }
  }

  public static async fetchUserProfile(username: string): Promise<any> {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          rating
          globalRanking
        }
        matchedUser(username: $username) {
          username
        }
      }
    `;
    return this.makeGraphQLRequest(query, { username });
  }

  public static async fetchUserTopics(username: string): Promise<LeetCodeTopic[]> {
    const query = `
      query skillStats($username: String!) {
        matchedUser(username: $username) {
          tagProblemCounts {
            advanced { tagName problemsSolved }
            intermediate { tagName problemsSolved }
            fundamental { tagName problemsSolved }
          }
        }
      }
    `;
    const data = await this.makeGraphQLRequest(query, { username });
    if (!data || !data.matchedUser || !data.matchedUser.tagProblemCounts) {
      return [];
    }

    const counts = data.matchedUser.tagProblemCounts;
    const topics: LeetCodeTopic[] = [];

    const categories = ['advanced', 'intermediate', 'fundamental'];
    for (const cat of categories) {
      if (counts[cat]) {
        for (const item of counts[cat]) {
          topics.push({
            topic: item.tagName,
            solved_count: item.problemsSolved,
          });
        }
      }
    }

    return topics;
  }

  public static async fetchUserContestHistory(username: string): Promise<LeetCodeHistoryItem[]> {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;
    const data = await this.makeGraphQLRequest(query, { username });
    if (!data || !data.userContestRankingHistory) {
      return [];
    }

    const history: LeetCodeHistoryItem[] = data.userContestRankingHistory;
    // Filter only attended contests with valid ranking and rating (meaning rating result has been finalized)
    return history.filter((item) => item.attended && item.ranking && item.ranking > 0 && item.rating && item.rating > 0);
  }
}
