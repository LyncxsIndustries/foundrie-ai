'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface TaskProgressLog {
  id: string;
  taskId: string;
  projectId: string;
  taskType: string;
  stage: string;
  progress: number;
  message: string;
  metadata: any;
  timestamp: string;
}

interface ProgressHistoryViewerProps {
  taskId: string;
  projectId: string;
  className?: string;
}

export function ProgressHistoryViewer({
  taskId,
  projectId,
  className = '',
}: ProgressHistoryViewerProps) {
  const [logs, setLogs] = useState<TaskProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, [taskId, projectId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/tasks/history/${taskId}?projectId=${projectId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress history');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedIds(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500">Loading progress history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        No progress history available for this task.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Progress History</h3>
        <span className="text-sm text-gray-500">{logs.length} entries</span>
      </div>

      <div className="space-y-2">
        {logs.map((log, index) => {
          const isExpanded = expandedIds.has(log.id);
          const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

          return (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Stage and Progress */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{log.stage}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressColor(log.progress)}`}
                          style={{ width: `${log.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{log.progress}%</span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-700">{log.message}</p>
                </div>

                {/* Expand/Collapse Button */}
                {hasMetadata && (
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Metadata */}
              {isExpanded && hasMetadata && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Metadata
                  </div>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Task Type Badge */}
              <div className="mt-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {log.taskType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
