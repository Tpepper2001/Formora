import React, { useState, useEffect, useMemo } from 'react';
import {
  FilePlus,
  Radio,
  Inbox,
  Clock,
  ExternalLink,
  Filter,
  CheckCircle2,
  Trash2,
  Edit3,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { AuditLogItem } from '../types/form';
import { subscribeAuditLogs } from '../services/firestoreService';

interface ActivityLogProps {
  userId?: string;
  onOpenForm?: (formId: string) => void;
  onOpenResponses?: (formId: string) => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  userId,
  onOpenForm,
  onOpenResponses,
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'created' | 'published' | 'response'>('all');

  useEffect(() => {
    if (!userId) {
      // Check localStorage for offline / guest activity cache
      try {
        const local = localStorage.getItem('formora_guest_activity_logs');
        if (local) {
          setLogs(JSON.parse(local));
        }
      } catch (e) {
        console.warn('Could not read local activity logs:', e);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeAuditLogs(
      userId,
      (remoteLogs) => {
        setLogs(remoteLogs);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Audit logs subscription error:', err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedFilter === 'created') return log.action === 'Form Created';
      if (selectedFilter === 'published') return log.action === 'Form Published';
      if (selectedFilter === 'response') return log.action === 'Response Received';
      return true;
    });
  }, [logs, selectedFilter]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'Form Created':
        return {
          icon: <FilePlus className="w-3.5 h-3.5" />,
          colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          badgeText: 'Form Created',
        };
      case 'Form Published':
        return {
          icon: <Radio className="w-3.5 h-3.5" />,
          colorClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
          badgeText: 'Form Published',
        };
      case 'Response Received':
        return {
          icon: <Inbox className="w-3.5 h-3.5" />,
          colorClass: 'text-[#176B52] dark:text-[#228B6B] bg-[#E8F3EE] dark:bg-[#172D24] border-[#176B52]/20',
          badgeText: 'Response Received',
        };
      case 'Form Updated':
        return {
          icon: <Edit3 className="w-3.5 h-3.5" />,
          colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          badgeText: 'Form Updated',
        };
      case 'Form Deleted':
        return {
          icon: <Trash2 className="w-3.5 h-3.5" />,
          colorClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          badgeText: 'Form Deleted',
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          colorClass: 'text-[#737873] dark:text-[#9BA19B] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          badgeText: action,
        };
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-5 shadow-sm space-y-4">
      {/* Header with Title and Live Sync status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                Activity Log
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B52] dark:bg-[#228B6B] animate-pulse" />
                Live Firestore
              </span>
            </div>
            <p className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
              Real-time audit trail of form creations, publications, and collected responses
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 text-[11px] bg-[#F7F7F4] dark:bg-[#111412] p-1 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-xs'
                : 'text-[#737873] dark:text-[#9BA19B]'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setSelectedFilter('created')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              selectedFilter === 'created'
                ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-xs'
                : 'text-[#737873] dark:text-[#9BA19B]'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setSelectedFilter('published')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              selectedFilter === 'published'
                ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-xs'
                : 'text-[#737873] dark:text-[#9BA19B]'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setSelectedFilter('response')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              selectedFilter === 'response'
                ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-xs'
                : 'text-[#737873] dark:text-[#9BA19B]'
            }`}
          >
            Responses
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-[#E2E4DF]/60 dark:divide-[#272C28]/60">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#737873] dark:text-[#9BA19B] flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching audit logs from Firestore...</span>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.slice(0, 10).map((log) => {
            const config = getActionConfig(log.action);
            return (
              <div
                key={log.id}
                className="py-3 flex items-start justify-between gap-3 group transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${config.colorClass}`}
                  >
                    {config.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                        {log.action}
                      </span>
                      <span className="text-[11px] font-medium text-[#737873] dark:text-[#9BA19B] truncate max-w-[240px] sm:max-w-md">
                        — {log.formTitle}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] mt-0.5 line-clamp-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-[11px] text-[#737873] dark:text-[#9BA19B] font-mono whitespace-nowrap">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                  {log.formId && onOpenForm && (
                    <button
                      onClick={() => onOpenForm(log.formId!)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#737873] hover:text-[#176B52] dark:hover:text-[#228B6B] transition-all"
                      title="Open Form"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
              No activity logged yet
            </p>
            <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] max-w-sm mx-auto">
              Actions like creating a form, publishing to respondents, or receiving responses will automatically log here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
