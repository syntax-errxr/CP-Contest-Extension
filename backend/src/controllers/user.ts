import { Router, Response } from 'express';
import { prisma } from '../db/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { CodeforcesService } from '../services/codeforces';
import { LeetCodeService } from '../services/leetcode';
import { AtCoderService } from '../services/atcoder';
import { CodeChefService } from '../services/codechef';
import { triggerInitialSync, syncAllUserPlatforms } from '../services/sync';

const router = Router();

// Apply authMiddleware to all user routes
router.use(authMiddleware);

// GET /api/user/platforms
router.get('/platforms', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const links = await prisma.platformLink.findMany({
      where: { userId },
    });

    const now = new Date();
    for (const link of links) {
      const diffMs = now.getTime() - link.linkedAt.getTime();
      const diffMins = diffMs / (1000 * 60);

      if (diffMins > 15) {
        // Update linkedAt to throttle sync triggers
        await prisma.platformLink.update({
          where: { id: link.id },
          data: { linkedAt: now },
        });

        // Run sync in the background (do not await)
        triggerInitialSync(userId, link.platform, link.username).catch((err) => {
          console.error(`Error running background sync for ${link.platform}:`, err.message);
        });
      }
    }

    // Return current links
    const updatedLinks = await prisma.platformLink.findMany({
      where: { userId },
    });
    return res.json(updatedLinks.map(l => ({
      id: l.id,
      user_id: l.userId,
      platform: l.platform,
      username: l.username,
      current_rating: l.currentRating,
      linked_at: l.linkedAt.toISOString()
    })));
  } catch (error: any) {
    console.error('Error fetching user platforms:', error.message);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/user/platforms
router.post('/platforms', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { platform, username } = req.body;

  if (!platform || !username) {
    return res.status(400).json({ detail: 'Platform and username are required.' });
  }

  const plat = platform.toLowerCase().trim();
  const user = username.trim();

  if (!['codeforces', 'leetcode', 'atcoder', 'codechef'].includes(plat)) {
    return res.status(400).json({ detail: 'Unsupported platform. Choose from codeforces, leetcode, atcoder, codechef.' });
  }

  try {
    let currentRating: number | null = null;

    // Validate handle exists on target platform
    if (plat === 'codeforces') {
      const info = await CodeforcesService.fetchUserInfo(user);
      if (!info) {
        return res.status(404).json({ detail: `Codeforces handle '${user}' not found.` });
      }
      currentRating = info.rating !== undefined ? info.rating : null;
    } else if (plat === 'leetcode') {
      const profile = await LeetCodeService.fetchUserProfile(user);
      if (!profile || !profile.matchedUser) {
        return res.status(404).json({ detail: `LeetCode user '${user}' not found.` });
      }
      const rankInfo = profile.userContestRanking;
      currentRating = rankInfo?.rating ? Math.round(rankInfo.rating) : null;
    } else if (plat === 'atcoder') {
      const info = await AtCoderService.fetchUserRating(user);
      if (!info) {
        return res.status(404).json({ detail: `AtCoder user '${user}' not found or has no contest history.` });
      }
      currentRating = info.rating;
    } else if (plat === 'codechef') {
      const info = await CodeChefService.fetchUserRating(user);
      if (!info) {
        return res.status(404).json({ detail: `CodeChef user '${user}' not found.` });
      }
      currentRating = info.rating;
    }

    // Upsert platform link in DB
    const existingLink = await prisma.platformLink.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: plat,
        },
      },
    });

    let link;
    if (existingLink) {
      // If the handle username is changing, purge the old handle's data for this platform
      if (existingLink.username !== user) {
        await prisma.userContestParticipation.deleteMany({
          where: {
            userId,
            contest: { platform: plat }
          }
        });
        await prisma.solvedProblem.deleteMany({
          where: {
            userId,
            platform: plat
          }
        });
      }

      link = await prisma.platformLink.update({
        where: { id: existingLink.id },
        data: {
          username: user,
          currentRating,
          linkedAt: new Date(),
        },
      });
    } else {
      link = await prisma.platformLink.create({
        data: {
          userId,
          platform: plat,
          username: user,
          currentRating,
          linkedAt: new Date(),
        },
      });
    }

    // Dispatch background sync task
    triggerInitialSync(userId, plat, user).catch((err) => {
      console.error(`Error in initial sync dispatch for ${plat}:`, err.message);
    });

    return res.json({
      message: `Successfully linked ${plat} handle '${user}'`,
      link: {
        id: link.id,
        user_id: link.userId,
        platform: link.platform,
        username: link.username,
        current_rating: link.currentRating,
        linked_at: link.linkedAt.toISOString()
      },
    });
  } catch (error: any) {
    console.error('Error linking platform handle:', error.message);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/user/platforms/:platform
router.delete('/platforms/:platform', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const plat = req.params.platform.toLowerCase().trim();

  try {
    const existingLink = await prisma.platformLink.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: plat,
        },
      },
    });

    if (!existingLink) {
      return res.status(404).json({ detail: `${req.params.platform} is not linked to this account.` });
    }

    // Delete associated data first
    await prisma.userContestParticipation.deleteMany({
      where: {
        userId,
        contest: { platform: plat }
      }
    });
    await prisma.solvedProblem.deleteMany({
      where: {
        userId,
        platform: plat
      }
    });

    await prisma.platformLink.delete({
      where: { id: existingLink.id },
    });

    return res.json({ message: `Successfully unlinked ${plat}` });
  } catch (error: any) {
    console.error('Error unlinking platform:', error.message);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/user/prev-contests
router.get('/prev-contests', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const participations = await prisma.userContestParticipation.findMany({
      where: { userId },
      include: { contest: true },
      orderBy: {
        contest: {
          startTime: 'desc',
        },
      },
    });

    return res.json(
      participations.map((part) => ({
        contest_id: part.contestId,
        contest_name: part.contest.name,
        platform: part.contest.platform,
        start_time: part.contest.startTime.toISOString(),
        url: part.contest.url,
        rank: part.rank,
        rating_delta: part.ratingDelta,
        upsolve_completed: part.upsolveCompleted,
        problems_total: part.problemsTotal,
        problems_upsolved: part.problemsUpsolved,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching previous contests:', error.message);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/user/sync
router.post('/sync', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const result = await syncAllUserPlatforms(userId);
    if (result.synced.length === 0 && result.skipped.length > 0) {
      return res.status(429).json({ detail: 'Please wait at least 3 minutes between manual syncs.' });
    }
    return res.json({ message: 'Sync complete.', synced: result.synced, skipped: result.skipped });
  } catch (error: any) {
    console.error('Error in user platform force-sync:', error.message);
    return res.status(500).json({ detail: 'Failed to sync platform profiles.' });
  }
});

export const userRouter = router;
