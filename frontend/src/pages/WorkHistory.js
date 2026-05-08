import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Calendar,
  TrendingUp,
  Users,
  Building2,
  IndianRupee,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  History,
  CalendarDays,
  Clock,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../utils/apiConfig';

const API = getApiUrl();
axios.defaults.withCredentials = true;

// ---------- helpers ----------
const formatDDMMYYYY = (d) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const fmtINR = (n) => {
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Compute start/end of common preset ranges, returning DD-MM-YYYY strings.
const PRESETS = {
  today: () => {
    const t = new Date();
    return { start: formatDDMMYYYY(t), end: formatDDMMYYYY(t), label: 'Today' };
  },
  yesterday: () => {
    const t = new Date();
    t.setDate(t.getDate() - 1);
    return { start: formatDDMMYYYY(t), end: formatDDMMYYYY(t), label: 'Yesterday' };
  },
  this_week: () => {
    const t = new Date();
    const day = t.getDay() === 0 ? 6 : t.getDay() - 1; // Mon-start
    const start = new Date(t);
    start.setDate(t.getDate() - day);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(t), label: 'This Week' };
  },
  last_week: () => {
    const t = new Date();
    const day = t.getDay() === 0 ? 6 : t.getDay() - 1;
    const end = new Date(t);
    end.setDate(t.getDate() - day - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(end), label: 'Last Week' };
  },
  this_month: () => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(t), label: 'This Month' };
  },
  last_month: () => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const end = new Date(t.getFullYear(), t.getMonth(), 0);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(end), label: 'Last Month' };
  },
  this_year: () => {
    const t = new Date();
    const start = new Date(t.getFullYear(), 0, 1);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(t), label: 'This Year' };
  },
  last_year: () => {
    const start = new Date(new Date().getFullYear() - 1, 0, 1);
    const end = new Date(new Date().getFullYear() - 1, 11, 31);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(end), label: 'Last Year' };
  },
  all_time: () => ({ start: '', end: '', label: 'All Time' }),
};

// ---------- shared sub-components ----------
function SummaryCards({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: 'Work Days Logged', value: summary.total_records ?? 0, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Unique Workers', value: summary.unique_workers ?? 0, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Unique Employers', value: summary.unique_employers ?? 0, icon: Building2, color: 'text-violet-600 bg-violet-50' },
    { label: 'Wages Paid (Worker)', value: fmtINR(summary.total_wages_earned), icon: IndianRupee, color: 'text-amber-600 bg-amber-50' },
    { label: 'Collected (From Employer)', value: fmtINR(summary.total_amount_collected), icon: TrendingUp, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Total Commission', value: fmtINR(summary.total_commission), icon: Award, color: 'text-pink-600 bg-pink-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">{c.label}</div>
                  <div className="text-lg font-bold text-slate-900">{c.value}</div>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DayOfWeekBars({ breakdown }) {
  if (!breakdown) return null;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const max = Math.max(1, ...days.map((d) => breakdown[d] || 0));
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          Day-of-Week Pattern
        </CardTitle>
        <CardDescription className="text-xs">Total worker-days present, broken down by day of the week.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {days.map((d) => {
            const v = breakdown[d] || 0;
            const pct = (v / max) * 100;
            return (
              <div key={d} className="flex items-center gap-2 text-xs">
                <div className="w-20 text-slate-600">{d.slice(0, 3)}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-10 text-right font-semibold text-slate-700">{v}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TopList({ title, icon: Icon, items, columns }) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs">#</th>
                {columns.map((c) => (
                  <th key={c.key} className={`${c.right ? 'text-right' : 'text-left'} px-4 py-2 font-medium text-slate-600 text-xs`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((it, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-500">
                    {idx === 0 && <span title="1st">🥇</span>}
                    {idx === 1 && <span title="2nd">🥈</span>}
                    {idx === 2 && <span title="3rd">🥉</span>}
                    {idx > 2 && idx + 1}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={`${c.right ? 'text-right' : 'text-left'} px-4 py-2 ${c.bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {c.format ? c.format(it[c.key], it) : it[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailedTable({ records }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'iso_date', dir: 'desc' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = records || [];
    if (q) {
      list = list.filter((r) =>
        (r.worker_name || '').toLowerCase().includes(q) ||
        (r.employer_name || '').toLowerCase().includes(q) ||
        (r.date || '').toLowerCase().includes(q) ||
        (r.day_of_week || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sort.dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return sorted;
  }, [records, search, sort]);

  const toggleSort = (key) =>
    setSort((p) => (p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const SortIcon = ({ k }) =>
    sort.key !== k ? (
      <ArrowUpDown className="w-3 h-3 inline-block ml-1 text-slate-400" />
    ) : sort.dir === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline-block ml-1 text-slate-700" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block ml-1 text-slate-700" />
    );

  const COLS = [
    { key: 'iso_date', label: 'Date', render: (r) => r.date },
    { key: 'day_of_week', label: 'Day', render: (r) => r.day_of_week?.slice(0, 3) },
    { key: 'worker_name', label: 'Worker', render: (r) => r.worker_name },
    { key: 'employer_name', label: 'Employer', render: (r) => r.employer_name || '—' },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'Present' ? 'default' : r.status === 'Absent' ? 'destructive' : 'secondary'}>
          {r.status}
        </Badge>
      ),
    },
    { key: 'wage_earned', label: 'Wage', right: true, render: (r) => fmtINR(r.wage_earned) },
    { key: 'amount_from_employer', label: 'From Employer', right: true, render: (r) => fmtINR(r.amount_from_employer) },
    { key: 'commission_amount', label: 'Commission', right: true, render: (r) => fmtINR(r.commission_amount), bold: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Detailed Records ({filtered.length})
            </CardTitle>
            <CardDescription className="text-xs">Click any column header to sort. Search filters by worker, employer, date, or status.</CardDescription>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-56 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200 sticky top-0">
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    className={`${c.right ? 'text-right' : 'text-left'} px-3 py-2 font-medium text-slate-600 text-xs cursor-pointer select-none hover:bg-slate-100`}
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                    <SortIcon k={c.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="text-center py-8 text-slate-500 text-sm">
                    No records found{search ? ' matching your search' : ''}.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    {COLS.map((c) => (
                      <td key={c.key} className={`${c.right ? 'text-right' : 'text-left'} px-3 py-2 ${c.bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportButtons({ filters, busy, setBusy }) {
  const downloadFile = useCallback(async (format) => {
    setBusy(true);
    try {
      const params = new URLSearchParams({ format });
      Object.entries(filters || {}).forEach(([k, v]) => { if (v) params.append(k, v); });
      const url = `${API}/reports/work-history/export?${params.toString()}`;
      const res = await axios.get(url, { responseType: 'blob', withCredentials: true });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const dl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl;
      // Filename from header if present
      const cd = res.headers['content-disposition'] || '';
      const m = cd.match(/filename="?([^";]+)"?/);
      a.download = m ? m[1] : `work-history.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dl);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      toast.error('Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [filters, setBusy]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => downloadFile('csv')} className="gap-1.5">
        <FileDown className="w-4 h-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => downloadFile('excel')} className="gap-1.5">
        <FileSpreadsheet className="w-4 h-4" /> Excel
      </Button>
      <Button size="sm" disabled={busy} onClick={() => downloadFile('pdf')} className="gap-1.5">
        <Download className="w-4 h-4" /> PDF
      </Button>
    </div>
  );
}

// ---------- main page ----------
export default function WorkHistory() {
  const [activeTab, setActiveTab] = useState('by-date');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Master data
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);

  // Tab state
  const [datePreset, setDatePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState(''); // ISO YYYY-MM-DD from <input type=date>
  const [customEnd, setCustomEnd] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workerStart, setWorkerStart] = useState('');
  const [workerEnd, setWorkerEnd] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState('');
  const [employerStart, setEmployerStart] = useState('');
  const [employerEnd, setEmployerEnd] = useState('');

  // Data per tab
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [w, e] = await Promise.all([
          axios.get(`${API}/workers`, { withCredentials: true }),
          axios.get(`${API}/employers`, { withCredentials: true }),
        ]);
        setWorkers(w.data || []);
        setEmployers(e.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Resolve filters based on active tab
  const activeFilters = useMemo(() => {
    if (activeTab === 'by-date') {
      if (datePreset === 'custom') {
        return {
          start_date: customStart ? customStart.split('-').reverse().join('-') : '',
          end_date: customEnd ? customEnd.split('-').reverse().join('-') : '',
        };
      }
      const p = PRESETS[datePreset]?.() || PRESETS.this_month();
      return { start_date: p.start, end_date: p.end };
    }
    if (activeTab === 'by-worker') {
      return {
        worker_id: selectedWorker || '',
        start_date: workerStart ? workerStart.split('-').reverse().join('-') : '',
        end_date: workerEnd ? workerEnd.split('-').reverse().join('-') : '',
      };
    }
    return {
      employer_id: selectedEmployer || '',
      start_date: employerStart ? employerStart.split('-').reverse().join('-') : '',
      end_date: employerEnd ? employerEnd.split('-').reverse().join('-') : '',
    };
  }, [activeTab, datePreset, customStart, customEnd, selectedWorker, workerStart, workerEnd, selectedEmployer, employerStart, employerEnd]);

  const fetchData = useCallback(async () => {
    // For worker/employer tabs, do not fetch until selection is made
    if (activeTab === 'by-worker' && !selectedWorker) { setData(null); return; }
    if (activeTab === 'by-employer' && !selectedEmployer) { setData(null); return; }
    setLoading(true);
    try {
      const params = {};
      Object.entries(activeFilters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await axios.get(`${API}/reports/work-history`, { params, withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to load work history');
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeFilters, selectedWorker, selectedEmployer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- render helpers ----------
  const renderResults = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading work history...
        </div>
      );
    }
    if (!data) {
      return (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <div className="text-sm">
              {activeTab === 'by-worker' ? 'Select a worker to see their work history.' :
               activeTab === 'by-employer' ? 'Select an employer to see their work history.' :
               'Select a date range to view work history.'}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <SummaryCards summary={data.summary} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DayOfWeekBars breakdown={data.day_of_week_breakdown} />
          {activeTab === 'by-worker' ? (
            <TopList
              title="Employers This Worker Has Served"
              icon={Building2}
              items={data.top_employers}
              columns={[
                { key: 'employer_name', label: 'Employer', bold: true },
                { key: 'worker_days', label: 'Days', right: true },
                { key: 'total_amount_paid', label: 'Total Paid', right: true, format: (v) => fmtINR(v) },
                { key: 'total_commission', label: 'Commission', right: true, format: (v) => fmtINR(v) },
              ]}
            />
          ) : activeTab === 'by-employer' ? (
            <TopList
              title="Workers This Employer Has Used"
              icon={Users}
              items={data.top_workers}
              columns={[
                { key: 'worker_name', label: 'Worker', bold: true },
                { key: 'days_worked', label: 'Days', right: true },
                { key: 'total_wages', label: 'Wages', right: true, format: (v) => fmtINR(v) },
                { key: 'total_commission', label: 'Commission', right: true, format: (v) => fmtINR(v) },
              ]}
            />
          ) : (
            <TopList
              title="Top Workers"
              icon={UserCheck}
              items={data.top_workers}
              columns={[
                { key: 'worker_name', label: 'Worker', bold: true },
                { key: 'days_worked', label: 'Days', right: true },
                { key: 'total_wages', label: 'Wages Paid', right: true, format: (v) => fmtINR(v) },
                { key: 'total_commission', label: 'Commission', right: true, format: (v) => fmtINR(v) },
              ]}
            />
          )}
        </div>

        {activeTab === 'by-date' && (
          <TopList
            title="Top Employers"
            icon={Briefcase}
            items={data.top_employers}
            columns={[
              { key: 'employer_name', label: 'Employer', bold: true },
              { key: 'worker_days', label: 'Worker-Days', right: true },
              { key: 'unique_workers', label: 'Unique Workers', right: true },
              { key: 'total_amount_paid', label: 'Amount Paid', right: true, format: (v) => fmtINR(v) },
              { key: 'total_commission', label: 'Commission', right: true, format: (v) => fmtINR(v) },
            ]}
          />
        )}

        <DetailedTable records={data.records} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-6 h-6 text-blue-600" />
                Work History
              </h1>
              <p className="text-sm text-slate-500">Audit any month, year, day, worker, or employer — and export it.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <ExportButtons filters={activeFilters} busy={exporting} setBusy={setExporting} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="by-date" className="gap-1.5"><CalendarDays className="w-4 h-4" /> By Date</TabsTrigger>
            <TabsTrigger value="by-worker" className="gap-1.5"><UserCheck className="w-4 h-4" /> By Worker</TabsTrigger>
            <TabsTrigger value="by-employer" className="gap-1.5"><Building2 className="w-4 h-4" /> By Employer</TabsTrigger>
          </TabsList>

          {/* === BY DATE TAB === */}
          <TabsContent value="by-date" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" /> Date Range
                </CardTitle>
                <CardDescription className="text-xs">Pick a quick preset or set a custom range.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.keys(PRESETS).map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={datePreset === k ? 'default' : 'outline'}
                      onClick={() => setDatePreset(k)}
                      className="text-xs"
                    >
                      {PRESETS[k]().label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={datePreset === 'custom' ? 'default' : 'outline'}
                    onClick={() => setDatePreset('custom')}
                    className="text-xs"
                  >
                    Custom Range
                  </Button>
                </div>
                {datePreset === 'custom' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500">From</label>
                      <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-auto" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500">To</label>
                      <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-auto" />
                    </div>
                  </div>
                )}
                {datePreset !== 'custom' && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Showing: <span className="font-medium text-slate-700">{activeFilters.start_date || 'All time'}</span>
                    {activeFilters.end_date && <> → <span className="font-medium text-slate-700">{activeFilters.end_date}</span></>}
                  </div>
                )}
              </CardContent>
            </Card>
            {renderResults()}
          </TabsContent>

          {/* === BY WORKER TAB === */}
          <TabsContent value="by-worker" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" /> Filter by Worker
                </CardTitle>
                <CardDescription className="text-xs">See every day a specific worker was present, where they worked, and how much they earned.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select a worker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">No workers yet. Add one first.</div>
                    ) : (
                      workers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name} — {w.phone_number}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">From (optional)</label>
                    <Input type="date" value={workerStart} onChange={(e) => setWorkerStart(e.target.value)} className="h-9 w-auto" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">To (optional)</label>
                    <Input type="date" value={workerEnd} onChange={(e) => setWorkerEnd(e.target.value)} className="h-9 w-auto" />
                  </div>
                  {(workerStart || workerEnd) && (
                    <Button variant="ghost" size="sm" onClick={() => { setWorkerStart(''); setWorkerEnd(''); }}>
                      Clear dates
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            {renderResults()}
          </TabsContent>

          {/* === BY EMPLOYER TAB === */}
          <TabsContent value="by-employer" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" /> Filter by Employer
                </CardTitle>
                <CardDescription className="text-xs">See every worker-day delivered to a specific employer, and reconcile dues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedEmployer} onValueChange={setSelectedEmployer}>
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select an employer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">No employers yet. Add one first.</div>
                    ) : (
                      employers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name} — {e.phone_number}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">From (optional)</label>
                    <Input type="date" value={employerStart} onChange={(e) => setEmployerStart(e.target.value)} className="h-9 w-auto" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">To (optional)</label>
                    <Input type="date" value={employerEnd} onChange={(e) => setEmployerEnd(e.target.value)} className="h-9 w-auto" />
                  </div>
                  {(employerStart || employerEnd) && (
                    <Button variant="ghost" size="sm" onClick={() => { setEmployerStart(''); setEmployerEnd(''); }}>
                      Clear dates
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            {renderResults()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
