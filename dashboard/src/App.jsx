import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  RefreshCw, Shield, Home, BarChart3, Activity, Settings,
  Bell, Search, AlertTriangle, CheckCircle, Users, Zap,
  TrendingUp, ChevronRight, Menu, X, Clock, Globe
} from 'lucide-react';

/* ── tiny helpers ── */
const ago = ts => {
  if (!ts) return '—';
  // Parse timestamp string in format "YYYY/MM/DD HH:MM:SS" (UTC from nginx logs)
  let d;
  if (typeof ts === 'string' && ts.includes('/')) {
    // Parse as UTC timestamp by using ISO format with Z suffix
    const parts = ts.split(' ');
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');
    // Create UTC date by using ISO string format
    const isoString = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T${timeParts[0]}:${timeParts[1]}:${timeParts[2]}Z`;
    d = new Date(isoString);
  } else {
    d = new Date(ts);
  }
  const now = Date.now(), diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const methodColor = m => ({
  GET: '#2563eb', POST: '#7c3aed', PUT: '#d97706', DELETE: '#dc2626', PATCH: '#059669'
}[m] || '#64748b');

const getSeverityLabel = severity => {
  if (!severity || severity === 'N/A') return 'UNKNOWN';
  const sev = parseInt(severity);
  if (sev >= 6) return 'CRITICAL';
  if (sev >= 5) return 'HIGH';
  if (sev >= 4) return 'MED';
  return 'LOW';
};
const severityStyle = s => ({
  CRITICAL: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  HIGH:     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  MED:      { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  LOW:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  UNKNOWN:  { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
}[s] || {});

const Badge = ({ s }) => {
  const st = severityStyle(s);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: st.bg, color: st.color, border: `1px solid ${st.border}`,
      letterSpacing: '0.06em',
    }}>{s}</span>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, up }) => (
  <div style={{
    background: '#fff', borderRadius: 14, padding: '22px 24px',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>{value}</div>
    <div style={{ fontSize: 11, color: up ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
      {up && <TrendingUp size={11} color="#ef4444" />}
      {sub}
    </div>
  </div>
);

export default function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const prevLen = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchLogs = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await axios.get('/api/waf-logs');
      const data = res.data;
      if (prevLen.current > 0 && data.length > prevLen.current) {
        const diff = data.length - prevLen.current;
        setNewCount(n => n + diff);
        setAlerts(a => [
          { id: Date.now(), msg: `${diff} new attack attempt${diff > 1 ? 's' : ''} detected`, ip: data[0]?.clientIp, rule: data[0]?.ruleId },
          ...a.slice(0, 2),
        ]);
        setTimeout(() => setAlerts(a => a.slice(0, -1)), 6000);
      }
      prevLen.current = data.length;
      setLogs(data);
      setError(null);
    } catch {
      setError('Unable to reach backend. Check that the API server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(() => fetchLogs(), 5000);
    return () => clearInterval(id);
  }, []);

  const total     = logs.length;
  const uniqueIPs = new Set(logs.map(l => l.clientIp)).size;

  const topRule = () => {
    if (!logs.length) return '—';
    const c = {}; logs.forEach(l => { c[l.ruleId] = (c[l.ruleId] || 0) + 1; });
    return Object.keys(c).reduce((a, b) => c[a] > c[b] ? a : b);
  };

  const topIP = () => {
    if (!logs.length) return '—';
    const c = {}; logs.forEach(l => { c[l.clientIp] = (c[l.clientIp] || 0) + 1; });
    return Object.keys(c).reduce((a, b) => c[a] > c[b] ? a : b);
  };

  const filtered = logs.filter(l =>
    !search || l.clientIp?.includes(search) || l.ruleId?.includes(search) || l.uri?.includes(search)
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'analytics',  label: 'Analytics',  icon: BarChart3 },
    { id: 'events',     label: 'Events',     icon: Activity },
    { id: 'settings',   label: 'Settings',   icon: Settings },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .trow:hover td { background: #f8fafc !important; }
        .nav-btn { transition: all 0.15s ease; }
        .nav-btn:hover { background: #f1f5f9 !important; color: #1d4ed8 !important; }
      `}</style>

      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: '#fff', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444',
            borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 300, animation: 'slideDown 0.3s ease', pointerEvents: 'auto',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertTriangle size={15} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{a.msg}</div>
              {(a.ip || a.rule) && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {a.ip && `from ${a.ip}`}{a.rule && ` · Rule ${a.rule}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: sidebarOpen ? 220 : 62, flexShrink: 0,
          background: '#fff', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s ease', overflow: 'hidden',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, borderBottom: '1px solid #e2e8f0', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>WAF Guard</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 600 }}>FIREWALL MONITOR</div>
                </div>
              </div>
            )}
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
              {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>

          <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => {
              const active = page === item.id;
              return (
                <button key={item.id} onClick={() => setPage(item.id)}
                  className="nav-btn"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: sidebarOpen ? '9px 12px' : '9px 0',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: active ? '#eff6ff' : 'transparent',
                    color: active ? '#1d4ed8' : '#64748b',
                    fontFamily: 'Inter, sans-serif', fontWeight: active ? 700 : 500, fontSize: 13,
                  }}>
                  <item.icon size={15} color={active ? '#1d4ed8' : '#94a3b8'} />
                  {sidebarOpen && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                  {active && sidebarOpen && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d4ed8' }} />}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div style={{ padding: '0 10px 16px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.07em' }}>SYSTEM ONLINE</span>
                </div>
                <div style={{ fontSize: 10, color: '#4ade80' }}>Protection active</div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <header style={{
            height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 0, zIndex: 30,
          }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {navItems.find(n => n.id === page)?.label}
              </h1>
              <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Clock size={10} />
                {new Date().toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IP, rule…"
                  style={{ paddingLeft: 30, paddingRight: 14, height: 36, borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, color: '#334155', outline: 'none', width: 210, fontFamily: 'Inter' }} />
              </div>

              <button onClick={() => fetchLogs(true)} disabled={refreshing}
                style={{ height: 36, padding: '0 16px', borderRadius: 9, cursor: 'pointer', background: '#1d4ed8', border: 'none', color: '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: refreshing ? 0.7 : 1 }}>
                <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                Refresh
              </button>

              <button style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Bell size={14} color="#64748b" />
                {newCount > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 36, borderRadius: 9, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>A</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Admin</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

            {error && (
              <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Loading data…</span>
              </div>

            ) : page === 'dashboard' ? (
              <>
                {/* New-attack banner */}
                {newCount > 0 && (
                  <div style={{
                    marginBottom: 20, padding: '12px 18px', borderRadius: 10,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    animation: 'slideDown 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertTriangle size={15} color="#ef4444" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                        {newCount} new attack attempt{newCount > 1 ? 's' : ''} detected since last visit
                      </span>
                    </div>
                    <button onClick={() => setNewCount(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                )}

                {/* Stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
                  <StatCard label="Total Incidents"    value={total}      sub="All time blocks"     icon={AlertTriangle} color="#ef4444" up />
                  <StatCard label="Blocked Requests"   value={total}      sub="100% block rate"     icon={CheckCircle}   color="#1d4ed8" />
                  <StatCard label="Unique Source IPs"  value={uniqueIPs}  sub="Distinct attackers"  icon={Globe}         color="#7c3aed" />
                  <StatCard label="Top Triggered Rule" value={topRule()}  sub="Highest frequency"   icon={Zap}           color="#d97706" />
                </div>

                {/* Main 2-col */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 22 }}>

                  {/* Recent events table */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Recent Blocked Requests</span>
                      </div>
                      <button onClick={() => setPage('events')} style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Time', 'Source IP', 'Rule', 'Method', 'Severity'].map(h => (
                            <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 7).map((log, i) => (
                          <tr key={i} className="trow">
                            <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #f8fafc', whiteSpace: 'nowrap' }}>{ago(log.timestamp)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', borderBottom: '1px solid #f8fafc' }}>{log.clientIp}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, color: '#475569', fontFamily: 'monospace', borderBottom: '1px solid #f8fafc' }}>{log.ruleId}</td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: methodColor(log.method), background: `${methodColor(log.method)}12`, padding: '2px 7px', borderRadius: 5 }}>{log.method}</span>
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc' }}>
                              <Badge s={getSeverityLabel(log.severity)} />
                            </td>
                          </tr>
                        ))}
                        {!logs.length && (
                          <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#cbd5e1' }}>No events yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Right panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Top attacker */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Most Active Attacker</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={17} color="#ef4444" />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{topIP()}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Highest request count</div>
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Requests blocked</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{logs.filter(l => l.clientIp === topIP()).length}</span>
                      </div>
                    </div>

                    {/* Method breakdown */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', flex: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Method Breakdown</div>
                      {(() => {
                        const c = {}; logs.forEach(l => { c[l.method] = (c[l.method] || 0) + 1; });
                        const entries = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4);
                        const max = entries[0]?.[1] || 1;
                        return entries.length ? entries.map(([m, v]) => (
                          <div key={m} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{m}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: methodColor(m) }}>{v}</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9' }}>
                              <div style={{ height: '100%', borderRadius: 99, width: `${(v / max) * 100}%`, background: methodColor(m), transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                        )) : <div style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', padding: '12px 0' }}>No data yet</div>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Bottom summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {[
                    { label: 'Avg Hits per IP',   val: uniqueIPs ? (total / uniqueIPs).toFixed(1) : 0, icon: Users,        color: '#7c3aed' },
                    { label: 'Distinct Methods',  val: new Set(logs.map(l => l.method)).size,          icon: Activity,     color: '#0891b2' },
                    { label: 'Protection Status', val: 'Active',                                        icon: CheckCircle,  color: '#16a34a', isText: true },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={17} color={item.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: item.isText ? 14 : 22, fontWeight: 800, color: item.isText ? item.color : '#0f172a', letterSpacing: '-0.02em' }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>

            ) : page === 'events' ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>All Security Events</span>
                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>{filtered.length}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Timestamp', 'Source IP', 'Endpoint', 'Rule', 'Message', 'Method', 'Status', 'Severity'].map(h => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((log, i) => (
                        <tr key={i} className="trow">
                          <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #f8fafc', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                          <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f8fafc', fontFamily: 'monospace' }}>{log.clientIp}</td>
                          <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #f8fafc', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.uri}</td>
                          <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#334155', fontFamily: 'monospace', borderBottom: '1px solid #f8fafc' }}>{log.ruleId}</td>
                          <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #f8fafc', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: methodColor(log.method), background: `${methodColor(log.method)}12`, padding: '2px 7px', borderRadius: 5 }}>{log.method}</span>
                          </td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>{log.status}</span>
                          </td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc' }}>
                            <Badge s={getSeverityLabel(log.severity)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            ) : page === 'analytics' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { title: 'Attack Volume', rows: [{ label: 'Total Blocked', val: total, color: '#ef4444', w: 100 }, { label: 'Unique Attackers', val: uniqueIPs, color: '#1d4ed8', w: uniqueIPs && total ? Math.round((uniqueIPs / total) * 100) : 0 }] },
                  { title: 'IP Analysis',   rows: [{ label: 'Unique IPs', val: uniqueIPs, color: '#7c3aed', w: 70 }, { label: 'Avg Hits/IP', val: uniqueIPs ? (total / uniqueIPs).toFixed(1) : 0, color: '#d97706', w: 50 }] },
                ].map(card => (
                  <div key={card.title} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{card.title}</div>
                    {card.rows.map(row => (
                      <div key={row.label} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.val}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
                          <div style={{ height: '100%', borderRadius: 99, width: `${row.w}%`, background: row.color, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

            ) : (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 32, maxWidth: 520 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Settings</div>
                {[
                  { label: 'Auto-refresh',          desc: 'Refresh data every 5 seconds' },
                  { label: 'Email Alerts',           desc: 'Send alerts on critical threats' },
                  { label: 'Attack Notifications',   desc: 'Show toast when new attacks arrive' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: '#1d4ed8', cursor: 'pointer' }} />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}