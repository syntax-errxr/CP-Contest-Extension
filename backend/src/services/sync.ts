import { prisma } from '../db/client';
import { CodeforcesService } from './codeforces';
import { LeetCodeService } from './leetcode';
import { AtCoderService } from './atcoder';
import { CodeChefService } from './codechef';
import axios from 'axios';

async function getCfContestProblemsCount(contestId: number): Promise<number> {
  const url = `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`;
  try {
    const response = await axios.get(url, { timeout: 5000 });
    if (response.data.status === 'OK' && response.data.result?.problems) {
      return response.data.result.problems.length;
    }
  } catch (error) {
    // Ignore error and return fallback
  }
  return 6; // fallback to standard contest size
}

export async function syncCodeforcesData(userId: string, username: string): Promise<void> {
  // 1. Sync User Rating
  const info = await CodeforcesService.fetchUserInfo(username);
  if (info && info.rating !== undefined) {
    await prisma.platformLink.updateMany({
      where: { userId, platform: 'codeforces' },
      data: { currentRating: info.rating },
    });
  }

  // 2. Sync Solved Problems
  const submissions = await CodeforcesService.fetchUserSubmissions(username);
  for (const sub of submissions) {
    await prisma.solvedProblem.upsert({
      where: {
        userId_platform_problemId: {
          userId,
          platform: 'codeforces',
          problemId: sub.problem_id,
        },
      },
      update: {
        rating: sub.rating,
        topicTags: sub.topic_tags,
        solvedAt: sub.solved_at,
      },
      create: {
        userId,
        platform: 'codeforces',
        problemId: sub.problem_id,
        title: sub.title,
        rating: sub.rating,
        topicTags: sub.topic_tags,
        solvedAt: sub.solved_at,
      },
    });
  }

  // 3. Sync Contest History (Last 5 contests)
  const history = await CodeforcesService.fetchUserRatingHistory(username);
  const last5 = history.slice(-5);

  // Fetch all solved problems for CF once to check upsolving efficiently
  const cfSolved = await prisma.solvedProblem.findMany({
    where: { userId, platform: 'codeforces' },
  });

  for (const item of last5) {
    if (!item.rank || item.rank <= 0 || item.newRating === undefined || item.oldRating === undefined) {
      continue;
    }
    const contestId = item.contestId.toString();
    const fullContestId = `codeforces-${contestId}`;
    const startTime = new Date(item.ratingUpdateTimeSeconds * 1000);

    // Ensure Contest exists
    await prisma.contest.upsert({
      where: { id: fullContestId },
      update: {},
      create: {
        id: fullContestId,
        name: item.contestName,
        platform: 'codeforces',
        startTime,
        durationSeconds: 7200, // default 2h
        url: `https://codeforces.com/contest/${contestId}`,
        status: 'completed',
      },
    });

    // Calculate upsolving
    const problemsTotal = await getCfContestProblemsCount(item.contestId);
    let problemsUpsolved = 0;
    for (const solved of cfSolved) {
      if (solved.problemId.startsWith(`${contestId}-`)) {
        problemsUpsolved++;
      }
    }
    const upsolvePct = problemsTotal > 0 ? Math.min(100.0, (problemsUpsolved / problemsTotal) * 100.0) : 0.0;

    // Save UserContestParticipation
    await prisma.userContestParticipation.upsert({
      where: {
        userId_contestId: {
          userId,
          contestId: fullContestId,
        },
      },
      update: {
        rank: item.rank,
        ratingDelta: item.newRating - item.oldRating,
        upsolveCompleted: upsolvePct,
        problemsTotal,
        problemsUpsolved,
      },
      create: {
        userId,
        contestId: fullContestId,
        rank: item.rank,
        ratingDelta: item.newRating - item.oldRating,
        upsolveCompleted: upsolvePct,
        problemsTotal,
        problemsUpsolved,
      },
    });
  }
}

export async function syncLeetCodeData(userId: string, username: string): Promise<void> {
  // 1. Sync User Rating
  const profile = await LeetCodeService.fetchUserProfile(username);
  let rating: number | null = null;
  if (profile?.userContestRanking?.rating) {
    rating = Math.round(profile.userContestRanking.rating);
  }

  if (rating !== null) {
    await prisma.platformLink.updateMany({
      where: { userId, platform: 'leetcode' },
      data: { currentRating: rating },
    });
  }

  // 2. Sync Solved Problems (Topic aggregations)
  const topics = await LeetCodeService.fetchUserTopics(username);
  for (const t of topics) {
    const pId = `leetcode-topic-${t.topic.toLowerCase().replace(/ /g, '-')}`;
    await prisma.solvedProblem.upsert({
      where: {
        userId_platform_problemId: {
          userId,
          platform: 'leetcode',
          problemId: pId,
        },
      },
      update: {
        rating: t.solved_count, // Store solved count in the rating column
        solvedAt: new Date(),
      },
      create: {
        userId,
        platform: 'leetcode',
        problemId: pId,
        title: `Solved ${t.topic} Problems`,
        rating: t.solved_count,
        topicTags: t.topic,
        solvedAt: new Date(),
      },
    });
  }

  // 3. Sync Contest History (Last 5 attended contests)
  const history = await LeetCodeService.fetchUserContestHistory(username);
  // history is already filtered for attended contests, sorted oldest to newest
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (!item.ranking || item.ranking <= 0 || !item.rating || item.rating <= 0) {
      continue;
    }
    const cTitle = item.contest.title;
    const cId = `leetcode-${cTitle.toLowerCase().replace(/ /g, '-')}`;

    const prevRating = i === 0 ? 1500 : history[i - 1].rating;
    const ratingDelta = Math.round(item.rating - prevRating);

    // Save details for the last 5 contests
    if (i >= history.length - 5) {
      // Ensure Contest exists
      await prisma.contest.upsert({
        where: { id: cId },
        update: {},
        create: {
          id: cId,
          name: cTitle,
          platform: 'leetcode',
          startTime: new Date(item.contest.startTime * 1000),
          durationSeconds: 5400, // 1.5h
          url: 'https://leetcode.com/contest/',
          status: 'completed',
        },
      });

      // Save UserContestParticipation
      await prisma.userContestParticipation.upsert({
        where: {
          userId_contestId: {
            userId,
            contestId: cId,
          },
        },
        update: {
          rank: item.ranking,
          ratingDelta,
        },
        create: {
          userId,
          contestId: cId,
          rank: item.ranking,
          ratingDelta,
          upsolveCompleted: 100.0,
        },
      });
    }
  }
}

export async function syncAtCoderData(userId: string, username: string): Promise<void> {
  // 1. Sync User Rating & last contest
  const info = await AtCoderService.fetchUserRating(username);
  if (!info) return;

  await prisma.platformLink.updateMany({
    where: { userId, platform: 'atcoder' },
    data: { currentRating: info.rating },
  });

  const lastContestName = info.last_contest_name;
  if (lastContestName && info.last_contest_rank && info.last_contest_rank > 0 && info.last_contest_delta !== undefined) {
    const cId = `atcoder-${lastContestName.toLowerCase().replace(/ /g, '-')}`;

    // Ensure Contest exists
    await prisma.contest.upsert({
      where: { id: cId },
      update: {},
      create: {
        id: cId,
        name: lastContestName,
        platform: 'atcoder',
        startTime: new Date(), // AtCoder history endtime is timezone-based, fallback to now
        durationSeconds: 7200,
        url: 'https://atcoder.jp/',
        status: 'completed',
      },
    });

    // Save UserContestParticipation
    await prisma.userContestParticipation.upsert({
      where: {
        userId_contestId: {
          userId,
          contestId: cId,
        },
      },
      update: {
        rank: info.last_contest_rank,
        ratingDelta: info.last_contest_delta,
      },
      create: {
        userId,
        contestId: cId,
        rank: info.last_contest_rank,
        ratingDelta: info.last_contest_delta,
        upsolveCompleted: 100.0,
      },
    });
  }
}

export async function syncCodeChefData(userId: string, username: string): Promise<void> {
  // 1. Sync User Rating
  const info = await CodeChefService.fetchUserRating(username);
  if (!info) return;

  await prisma.platformLink.updateMany({
    where: { userId, platform: 'codechef' },
    data: { currentRating: info.rating },
  });

  // 2. Sync Contest History
  const history = await CodeChefService.fetchUserContestHistory(username);
  const validHistory = history.filter(item => {
    const rank = parseInt(item.rank || '0', 10);
    const rating = parseInt(item.rating || '0', 10);
    return rank > 0 && rating > 0;
  });

  const computedHistory = validHistory.map((item, i) => {
    const currRating = parseInt(item.rating || '0', 10);
    let prevRating = 1500;
    if (i > 0) {
      prevRating = parseInt(validHistory[i - 1].rating || '1500', 10);
    }
    const delta = currRating - prevRating;
    return {
      ...item,
      rating_delta: delta,
    };
  });

  const last5 = computedHistory.slice(-5);
  for (const item of last5) {
    const cCode = item.code;
    if (!cCode) continue;

    const cId = `codechef-${cCode.toLowerCase()}`;
    let startTime = new Date();
    if (item.end_date) {
      const parsedTime = new Date(item.end_date.replace(' ', 'T'));
      if (!isNaN(parsedTime.getTime())) {
        startTime = parsedTime;
      }
    }

    // Ensure Contest exists
    await prisma.contest.upsert({
      where: { id: cId },
      update: {},
      create: {
        id: cId,
        name: item.name || `CodeChef Contest ${cCode}`,
        platform: 'codechef',
        startTime,
        durationSeconds: 10800, // default 3h
        url: `https://www.codechef.com/${cCode}`,
        status: 'completed',
      },
    });

    const rank = parseInt(item.rank || '0', 10);
    const delta = item.rating_delta;

    // Save UserContestParticipation
    await prisma.userContestParticipation.upsert({
      where: {
        userId_contestId: {
          userId,
          contestId: cId,
        },
      },
      update: {
        rank,
        ratingDelta: delta,
      },
      create: {
        userId,
        contestId: cId,
        rank,
        ratingDelta: delta,
        upsolveCompleted: 100.0,
      },
    });
  }
}

export async function triggerInitialSync(userId: string, platform: string, username: string): Promise<void> {
  console.log(`Starting background initial sync for ${platform} (${username}) user ID: ${userId}...`);
  try {
    if (platform === 'codeforces') {
      await syncCodeforcesData(userId, username);
    } else if (platform === 'leetcode') {
      await syncLeetCodeData(userId, username);
    } else if (platform === 'atcoder') {
      await syncAtCoderData(userId, username);
    } else if (platform === 'codechef') {
      await syncCodeChefData(userId, username);
    }
    console.log(`Successfully completed initial sync for ${platform} (${username}).`);
  } catch (error: any) {
    console.error(`Error in triggerInitialSync for ${platform} (${username}):`, error.message);
  }
}

export async function syncAllUserPlatforms(userId: string): Promise<{ synced: string[]; skipped: string[] }> {
  const links = await prisma.platformLink.findMany({
    where: { userId },
  });

  const now = new Date();
  const synced: string[] = [];
  const skipped: string[] = [];

  const promises = links.map(async (link) => {
    const diffMs = now.getTime() - link.linkedAt.getTime();
    const cooldownLimit = 3 * 60 * 1000; // 3 minutes

    if (diffMs < cooldownLimit) {
      skipped.push(link.platform);
      return;
    }

    synced.push(link.platform);

    try {
      if (link.platform === 'codeforces') {
        await syncCodeforcesData(userId, link.username);
      } else if (link.platform === 'leetcode') {
        await syncLeetCodeData(userId, link.username);
      } else if (link.platform === 'atcoder') {
        await syncAtCoderData(userId, link.username);
      } else if (link.platform === 'codechef') {
        await syncCodeChefData(userId, link.username);
      }

      // Update linkedAt timestamp to reflect last sync time
      await prisma.platformLink.update({
        where: { id: link.id },
        data: { linkedAt: now },
      });
    } catch (err: any) {
      console.error(`Error syncing ${link.platform} inside force-sync:`, err.message);
      // Even if one platform fails, let the others continue
    }
  });

  await Promise.all(promises);
  return { synced, skipped };
}
