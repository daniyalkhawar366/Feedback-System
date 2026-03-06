'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  DollarSign,
  Zap,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ChevronRight,
  Calendar,
  Hash,
  Clock,
  Database,
} from 'lucide-react';

interface UsageSummary {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  success_rate: number;
  period_start: string;
  period_end: string;
}

interface UsageByOperation {
  operation: string;
  requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
}

interface UsageByModel {
  provider: string;
  model: string;
  requests: number;
  total_tokens: number;
  total_cost: number;
}

interface TimelineData {
  timestamp: string;
  requests: number;
  tokens: number;
  cost: number;
  errors: number;
}

interface RunOperation {
  operation: string;
  requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  total_cost: number;
  cached_cost: number;
  avg_latency_ms: number;
}

interface PipelineRun {
  run_number: number;
  timestamp: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  cached_tokens: number;
  cached_cost: number;
  avg_latency_ms: number;
  errors: number;
  operations: RunOperation[];
}

interface EventUsage {
  event_id: string;
  event_title: string;
  total_runs: number;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  latest_activity: string;
  runs: PipelineRun[];
}

export default function MonitoringPage() {
  const { speaker, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [byOperation, setByOperation] = useState<UsageByOperation[]>([]);
  const [byModel, setByModel] = useState<UsageByModel[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [byEvent, setByEvent] = useState<EventUsage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    } else if (!isLoading && isAuthenticated && speaker?.role !== 'admin') {
      // Non-admin users should not access monitoring
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, speaker, router]);

  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all monitoring data in parallel
      const [summaryRes, operationRes, modelRes, timelineRes, eventRes] = await Promise.all([
        fetch(`${API_BASE_URL}/monitoring/usage/summary?hours=${timeRange}`, { headers }),
        fetch(`${API_BASE_URL}/monitoring/usage/by-operation?hours=${timeRange}`, { headers }),
        fetch(`${API_BASE_URL}/monitoring/usage/by-model?hours=${timeRange}`, { headers }),
        fetch(`${API_BASE_URL}/monitoring/usage/timeline?hours=${timeRange}&interval_minutes=60`, { headers }),
        fetch(`${API_BASE_URL}/monitoring/usage/by-event?hours=${timeRange}`, { headers }),
      ]);

      if (!summaryRes.ok || !operationRes.ok || !modelRes.ok || !timelineRes.ok || !eventRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const summaryData = await summaryRes.json();
      const operationData = await operationRes.json();
      const modelData = await modelRes.json();
      const timelineData = await timelineRes.json();
      const eventData = await eventRes.json();

      setSummary(summaryData);
      setByOperation(operationData);
      setByModel(modelData);
      setTimeline(timelineData);
      setByEvent(eventData);
    } catch (err: any) {
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && speaker?.role === 'admin') {
      fetchMonitoringData();
    }
  }, [isAuthenticated, speaker, timeRange]);

  if (isLoading || !isAuthenticated || speaker?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly>
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Admin Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-gray-900 tracking-[0.01em] leading-tight">
                  Admin Monitoring
                </h1>
                <p className="text-[13px] text-gray-600 font-normal">
                  {speaker?.name} &middot; Administrator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-[14px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-[14px] text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                API Usage Monitoring
              </h1>
              <p className="mt-2 text-gray-600">
                Track LLM token usage and costs in real-time
              </p>
            </div>
            <button
              onClick={fetchMonitoringData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="mt-4 flex gap-2">
            {[1, 6, 12, 24, 48, 168, 336, 720, 2160, 8760].map((hours) => {
              const label = hours < 24 ? `${hours}h` : hours < 8760 ? `${hours / 24}d` : 'All';
              return (
                <button
                  key={hours}
                  onClick={() => setTimeRange(hours)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === hours
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {loading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          summary && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  icon={<Activity className="w-6 h-6" />}
                  title="Total Requests"
                  value={summary.total_requests.toLocaleString()}
                  iconColor="text-blue-600"
                  bgColor="bg-blue-100"
                />
                <MetricCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Total Tokens"
                  value={summary.total_tokens.toLocaleString()}
                  iconColor="text-purple-600"
                  bgColor="bg-purple-100"
                />
                <MetricCard
                  icon={<DollarSign className="w-6 h-6" />}
                  title="Total Cost"
                  value={`$${summary.total_cost.toFixed(4)}`}
                  iconColor="text-green-600"
                  bgColor="bg-green-100"
                />
                <MetricCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  title="Success Rate"
                  value={`${summary.success_rate.toFixed(1)}%`}
                  subtitle={`Avg: ${summary.avg_latency_ms.toFixed(0)}ms`}
                  iconColor="text-orange-600"
                  bgColor="bg-orange-100"
                />
              </div>

              {/* Usage by Operation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Usage by Operation
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requests
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Latency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {byOperation.map((op) => (
                        <tr key={op.operation} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {op.operation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {op.requests.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {op.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            ${op.total_cost.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {op.avg_latency_ms.toFixed(0)}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Usage by Event (Grouped Pipeline Runs) */}
              {byEvent.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Usage by Event
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">
                    Pipeline runs grouped by event. Expand to see per-run classification &amp; report costs.
                  </p>
                  <div className="space-y-3">
                    {byEvent.map((evt) => (
                      <EventAccordion key={evt.event_id} event={evt} />
                    ))}
                  </div>
                </div>
              )}

              {/* Usage by Model */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Usage by Model
                </h2>
                <div className="space-y-4">
                  {byModel.map((model) => (
                    <div
                      key={`${model.provider}-${model.model}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {model.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {model.provider}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${model.total_cost.toFixed(4)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {model.requests} requests • {model.total_tokens.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  bgColor: string;
}

function MetricCard({ icon, title, value, subtitle, iconColor, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Event Accordion – one per event, with expandable pipeline runs     */
/* ------------------------------------------------------------------ */

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function opLabel(op: string) {
  return op
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function EventAccordion({ event }: { event: EventUsage }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Event header – always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">
              {event.event_title}
            </h3>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {event.total_runs} {event.total_runs === 1 ? 'run' : 'runs'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(event.latest_activity)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-sm">
          <div className="text-right hidden sm:block">
            <span className="text-gray-500">Requests</span>
            <p className="font-semibold text-gray-800">{event.total_requests}</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-gray-500">Tokens</span>
            <p className="font-semibold text-gray-800">{event.total_tokens.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Cost</span>
            <p className="font-semibold text-indigo-600">${event.total_cost.toFixed(4)}</p>
          </div>
        </div>
      </button>

      {/* Runs – shown when expanded */}
      {open && (
        <div className="divide-y divide-gray-100">
          {event.runs.map((run) => (
            <RunCard key={run.run_number} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  RunCard – one per pipeline execution inside an event accordion     */
/* ------------------------------------------------------------------ */

function RunCard({ run }: { run: PipelineRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white">
      {/* Run header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-indigo-50/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className={`transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {run.run_number}
          </span>
          <span className="text-sm text-gray-600">
            Run #{run.run_number}
          </span>
          <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
            {formatDate(run.timestamp)}
          </span>
          {run.errors > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {run.errors} error{run.errors > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5 text-xs shrink-0">
          <span className="text-gray-500">{run.total_requests} req</span>
          <span className="text-gray-500">{run.total_tokens.toLocaleString()} tok</span>
          <span className="font-semibold text-gray-800">${run.total_cost.toFixed(4)}</span>
          <span className="text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {run.avg_latency_ms.toFixed(0)}ms
          </span>
        </div>
      </button>

      {/* Operation detail table */}
      {expanded && (
        <div className="px-5 pb-4 pt-1">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operation</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Requests</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prompt</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Completion</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cached</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {run.operations.map((op) => (
                  <tr key={op.operation} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                      {opLabel(op.operation)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{op.requests}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{op.prompt_tokens.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{op.completion_tokens.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {op.cached_tokens > 0 ? (
                        <span className="text-emerald-600">{op.cached_tokens.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">{op.total_tokens.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-indigo-600">${op.total_cost.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{op.avg_latency_ms.toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
              {/* Run totals row */}
              <tfoot>
                <tr className="bg-gray-50/60 font-semibold text-gray-800">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-right">{run.total_requests}</td>
                  <td className="px-4 py-2.5 text-right">
                    {run.operations.reduce((a, o) => a + o.prompt_tokens, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {run.operations.reduce((a, o) => a + o.completion_tokens, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">
                    {run.cached_tokens > 0 ? run.cached_tokens.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">{run.total_tokens.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-indigo-600">${run.total_cost.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{run.avg_latency_ms.toFixed(0)}ms</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {run.cached_tokens > 0 && (
            <p className="mt-2 text-xs text-emerald-600">
              Saved ${run.cached_cost.toFixed(6)} from cached input tokens
            </p>
          )}
        </div>
      )}
    </div>
  );
}
