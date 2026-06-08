import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/Card';

declare const chrome: any;

export const Dashboard: React.FC = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [prevContests, setPrevContests] = useState<any[]>([]);
  
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [loadingContests, setLoadingContests] = useState(true);
  const [loadingPrev, setLoadingPrev] = useState(true);

  // Form input handles
  const [cfHandle, setCfHandle] = useState('');
  const [lcUsername, setLcUsername] = useState('');
  const [acUsername, setAcUsername] = useState('');
  const [ccUsername, setCcUsername] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setError(null);
    setSyncing(true);
    try {
      await api.syncPlatforms();
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to sync platforms.');
    } finally {
      setSyncing(false);
    }
  };
  const [activeAlarms, setActiveAlarms] = useState<string[]>([]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["active_contest_alarms"], (result: any) => {
        if (result.active_contest_alarms) {
          setActiveAlarms(result.active_contest_alarms);
        }
      });
    }
  }, []);

  const toggleAlarm = (contest: any) => {
    if (typeof chrome === 'undefined' || !chrome.alarms) {
      setError("Alarms API is not available (must run as Chrome Extension).");
      setTimeout(() => setError(null), 5000);
      return;
    }

    const alarmName = `contest-alarm|${contest.id}|${contest.name}|${contest.url}`;
    const isAlreadySet = activeAlarms.includes(contest.id);

    if (isAlreadySet) {
      chrome.alarms.clear(alarmName, (wasCleared: boolean) => {
        if (wasCleared) {
          const updated = activeAlarms.filter(id => id !== contest.id);
          setActiveAlarms(updated);
          chrome.storage.local.set({ active_contest_alarms: updated });
        }
      });
    } else {
      const startTimeMs = new Date(contest.start_time).getTime();
      const triggerTimeMs = startTimeMs - 5 * 60 * 1000; // 5 minutes before
      const nowMs = Date.now();

      if (triggerTimeMs <= nowMs) {
        // If starting in less than 5 minutes or already started, set alarm for 10 seconds from now
        const immediateTriggerMs = nowMs + 10 * 1000;
        chrome.alarms.create(alarmName, { when: immediateTriggerMs });
        
        const updated = [...activeAlarms, contest.id];
        setActiveAlarms(updated);
        chrome.storage.local.set({ active_contest_alarms: updated });
        setError("Contest starts in less than 5 minutes. Alarm set for 10 seconds from now.");
        setTimeout(() => setError(null), 5000);
      } else {
        chrome.alarms.create(alarmName, { when: triggerTimeMs });
        
        const updated = [...activeAlarms, contest.id];
        setActiveAlarms(updated);
        chrome.storage.local.set({ active_contest_alarms: updated });
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoadingPlatforms(true);
      const links = await api.getLinkedPlatforms();
      setPlatforms(links);
      setLoadingPlatforms(false);
    } catch (err) {
      setLoadingPlatforms(false);
    }

    try {
      setLoadingContests(true);
      const list = await api.getUpcomingContests();
      setContests(list.slice(0, 5)); // show top 5 upcoming contests
      setLoadingContests(false);
    } catch (err) {
      setLoadingContests(false);
    }

    try {
      setLoadingPrev(true);
      const prev = await api.getPreviousContests();
      const latestPerPlatform: any[] = [];
      const seenPlatforms = new Set();
      for (const contest of prev) {
        if (!seenPlatforms.has(contest.platform)) {
          seenPlatforms.add(contest.platform);
          latestPerPlatform.push(contest);
        }
      }
      setPrevContests(latestPerPlatform);
      setLoadingPrev(false);
    } catch (err) {
      setLoadingPrev(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLink = async (platform: string, username: string) => {
    if (!username) return;
    setError(null);
    try {
      await api.linkPlatform(platform, username);
      // Reset input fields
      if (platform === 'codeforces') setCfHandle('');
      if (platform === 'leetcode') setLcUsername('');
      if (platform === 'atcoder') setAcUsername('');
      if (platform === 'codechef') setCcUsername('');
      
      // Refresh statistics
      fetchData();
    } catch (err: any) {
      setError(err.message || `Failed to link ${platform}`);
    }
  };

  const handleUnlink = async (platform: string) => {
    setError(null);
    try {
      await api.unlinkPlatform(platform);
      fetchData();
    } catch (err: any) {
      setError(err.message || `Failed to unlink ${platform}`);
    }
  };

  const getLinkForPlatform = (platform: string) => {
    return platforms.find(p => p.platform === platform);
  };

  const formatContestTime = (isoString: string) => {
    const dt = new Date(isoString);
    return dt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div style={{ padding: '12px 16px', overflowY: 'auto', flexGrow: 1 }}>
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 71, 67, 0.1)', 
          color: 'var(--hard-danger)', 
          padding: '8px 12px', 
          borderRadius: '4px', 
          fontSize: '9.5pt', 
          marginBottom: '12px' 
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Linked Accounts Section */}
      <div className="flex-between" style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Linked Profiles
        </h2>
        <button 
          onClick={handleSync}
          disabled={syncing || loadingPlatforms}
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '8.5pt', display: 'flex', alignItems: 'center', gap: '4px', cursor: syncing ? 'not-allowed' : 'pointer' }}
        >
          {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
        </button>
      </div>
      <Card style={{ padding: '8px 12px' }}>
        {loadingPlatforms ? (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '9.5pt', color: 'var(--text-secondary)' }}>
            Loading profiles...
          </div>
        ) : (
          ["codeforces", "leetcode", "atcoder", "codechef"].map((plat) => {
            const link = getLinkForPlatform(plat);
            const nameMap: any = { codeforces: 'Codeforces', leetcode: 'LeetCode', atcoder: 'AtCoder', codechef: 'CodeChef' };
            
            return (
              <div key={plat} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '10pt' }}>{nameMap[plat]}</span>
                  {link && <span style={{ fontSize: '8.5pt', color: 'var(--text-secondary)' }}>@{link.username}</span>}
                </div>

                {link ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: '10pt' }}>
                      {link.current_rating !== null ? link.current_rating : 'unrated'}
                    </span>
                    <button 
                      onClick={() => handleUnlink(plat)}
                      style={{ background: 'none', border: 'none', color: 'var(--hard-danger)', cursor: 'pointer', fontSize: '11pt' }}
                      title="Unlink handle"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Handle"
                      value={
                        plat === 'codeforces' ? cfHandle :
                        plat === 'leetcode' ? lcUsername :
                        plat === 'atcoder' ? acUsername : ccUsername
                      }
                      onChange={(e) => {
                        if (plat === 'codeforces') setCfHandle(e.target.value);
                        if (plat === 'leetcode') setLcUsername(e.target.value);
                        if (plat === 'atcoder') setAcUsername(e.target.value);
                        if (plat === 'codechef') setCcUsername(e.target.value);
                      }}
                      style={{ width: '90px', padding: '4px 6px', fontSize: '9pt' }}
                    />
                    <button 
                      className="btn" 
                      style={{ padding: '4px 8px', fontSize: '8.5pt' }}
                      onClick={() => handleLink(
                        plat,
                        plat === 'codeforces' ? cfHandle :
                        plat === 'leetcode' ? lcUsername :
                        plat === 'atcoder' ? acUsername : ccUsername
                      )}
                    >
                      Link
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* Prev Contest Dashboard */}
      {loadingPrev ? (
        <>
          <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Latest Performance
          </h2>
          <Card style={{ padding: '16px', textAlign: 'center', fontSize: '9.5pt', color: 'var(--text-secondary)' }}>
            Loading performance...
          </Card>
        </>
      ) : prevContests.length > 0 && (
        <>
          <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Latest Performance
          </h2>
          {prevContests.map((prevContest) => (
            <Card key={prevContest.contest_id} style={{ marginBottom: '8px' }}>
              <div className="flex-between">
                <span style={{ fontWeight: 600, fontSize: '10pt', color: 'var(--text-primary)' }}>
                  {prevContest.contest_name}
                </span>
                <span style={{ 
                  fontSize: '8.5pt', 
                  textTransform: 'capitalize', 
                  color: 'white', 
                  backgroundColor: prevContest.platform === 'codeforces' ? 'var(--cf-blue)' : 
                                   prevContest.platform === 'leetcode' ? 'var(--brand-orange)' : 
                                   prevContest.platform === 'atcoder' ? '#1F2937' : '#965C38',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {prevContest.platform}
                </span>
              </div>
              
              <div className="flex-between" style={{ marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '8.5pt', color: 'var(--text-secondary)' }}>Rank</span>
                  <div className="mono" style={{ fontSize: '12pt', fontWeight: 600 }}>#{prevContest.rank || '-'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '8.5pt', color: 'var(--text-secondary)' }}>Rating Change</span>
                  <div className="mono" style={{ 
                    fontSize: '12pt', 
                    fontWeight: 600, 
                    color: (prevContest.rating_delta || 0) >= 0 ? 'var(--success-green)' : 'var(--hard-danger)' 
                  }}>
                    {(prevContest.rating_delta || 0) >= 0 ? `+${prevContest.rating_delta}` : prevContest.rating_delta}
                  </div>
                </div>
              </div>

            </Card>
          ))}
        </>
      )}

      {/* Upcoming Contests */}
      <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Upcoming Contests
      </h2>
      <Card style={{ padding: '6px 10px' }}>
        {loadingContests ? (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '9.5pt', color: 'var(--text-secondary)' }}>
            Loading schedule...
          </div>
        ) : contests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '9.5pt', color: 'var(--text-secondary)' }}>
            No upcoming contests scheduled.
          </div>
        ) : (
          contests.map((c) => (
            <div 
              key={c.id} 
              className="contest-row" 
              onClick={() => window.open(c.url, '_blank')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '75%' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAlarm(c);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11pt',
                    padding: '2px',
                    color: activeAlarms.includes(c.id) ? 'var(--brand-orange)' : 'var(--text-secondary)',
                    transition: 'color 0.2s',
                  }}
                  title={activeAlarms.includes(c.id) ? "Cancel Alarm" : "Set Alarm (5m before)"}
                >
                  {activeAlarms.includes(c.id) ? '🔔' : '🔕'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 600, fontSize: '9.5pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.name}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: '8pt', color: 'var(--text-secondary)' }}>
                    {formatContestTime(c.start_time)} ({formatDuration(c.duration_seconds)})
                  </span>
                </div>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{ 
                  fontSize: '8pt', 
                  fontWeight: 600,
                  textTransform: 'uppercase', 
                  color: c.platform === 'codeforces' ? 'var(--cf-blue)' : 
                         c.platform === 'leetcode' ? 'var(--brand-orange)' : 
                         c.platform === 'atcoder' ? 'var(--text-primary)' : '#965C38',
                  backgroundColor: 'var(--badge-bg)',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {c.platform}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
