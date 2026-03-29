import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Shield, Server, Activity, AlertTriangle, Globe } from 'lucide-react';
import NetworkMap from './components/NetworkMap';
import RiskReport from './components/RiskReport';

interface Asset {
  id: number;
  subdomain: string;
  ip: string;
  status: string;
  risk_score: number;
  technologies: any;
  discovered_at: string;
  scan_status?: string;
  progress?: number;
}

const getRiskLevel = (score: number) => {
  if (score >= 100) return { label: 'CRITICAL', color: 'bg-red-900/40 text-red-400' };
  if (score >= 50) return { label: 'HIGH', color: 'bg-orange-900/40 text-orange-400' };
  if (score >= 20) return { label: 'MEDIUM', color: 'bg-yellow-900/40 text-yellow-400' };
  return { label: 'LOW', color: 'bg-green-900/40 text-green-400' };
};

const API_BASE = "http://localhost:8000";

function App() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Poll for results if scanning
  useEffect(() => {
    let interval: any;
    if (scanStatus === 'scanning') {
      interval = setInterval(fetchResults, 3000);
    }
    return () => clearInterval(interval);
  }, [scanStatus, domain]);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setScanStatus('scanning');
    setProgress(0);
    setError('');
    try {
      await axios.post(`${API_BASE}/scan/${domain}`);
      fetchResults();
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred starting scan");
      setLoading(false);
      setScanStatus('idle');
    }
  };

  const fetchResults = async () => {
    if (!domain) return;
    try {
      const response = await axios.get(`${API_BASE}/results/${domain}`);
      setAssets(response.data);
      if (response.data.length > 0) {
        setScanStatus(response.data[0].scan_status);
        setProgress(response.data[0].progress || 0);
        if (response.data[0].scan_status !== 'scanning') {
          setLoading(false);
          setProgress(100);
        }
      }
    } catch (err) {
      setError("Failed to fetch results");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 shadow-2xl z-20">
        <div className="p-6 flex items-center space-x-3">
          <Shield className="text-blue-500" size={32} />
          <h1 className="text-xl font-bold tracking-tighter">SCOPE<span className="text-blue-500">INTEL</span></h1>
        </div>
        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <Activity size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis</div>
          <button 
            onClick={() => setActiveTab('network')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeTab === 'network' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <Globe size={20} />
            <span className="font-medium">Network Map</span>
          </button>
          <button 
            onClick={() => setActiveTab('risks')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeTab === 'risks' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <AlertTriangle size={20} />
            <span className="font-medium">Risk Reports</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 text-[10px] text-gray-500 text-center uppercase tracking-widest">
          v1.0.0 Professional Edition
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8 pb-20">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10">
            <div className="min-w-0">
              <h2 className="text-3xl font-bold truncate">
                {activeTab === 'dashboard' ? 'Attack Surface Dashboard' : 
                 activeTab === 'network' ? 'Interactive Network Map' : 'Professional Risk Report'}
              </h2>
              <div className="flex items-center mt-1 space-x-2">
                <p className="text-gray-400">Target Mapping Engine</p>
                {scanStatus === 'scanning' && (
                  <span className="flex items-center text-blue-400 text-sm animate-pulse">
                    <Activity size={14} className="mr-1" /> Scanning... {progress}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Enter domain (e.g. google.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-10 focus:ring-2 focus:ring-blue-500 outline-none w-full text-sm shadow-inner"
                />
                <Search className="absolute left-3 top-3 text-gray-500" size={18} />
              </div>
              <button
                onClick={handleScan}
                disabled={loading || scanStatus === 'scanning'}
                className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${(loading || scanStatus === 'scanning') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {scanStatus === 'scanning' ? 'Running Scan...' : 'Start Scan'}
              </button>
            </div>
          </header>

          {activeTab === 'dashboard' ? (
            <>
              {/* Progress Bar */}
              {scanStatus === 'scanning' && (
                <div className="mb-10 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em]">Engine Status</span>
                      <h3 className="text-lg font-bold text-white">Live Reconnaissance & Scanning</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-blue-400">{progress}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-700 p-0.5">
                    <div 
                      className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-3">
                    <p className="text-[10px] text-gray-500 font-medium italic">Concurrency: 5 threads | Multi-source Recon | Port Discovery | Risk Analysis</p>
                    <p className="text-[10px] text-blue-400 font-bold animate-pulse">ESTIMATED TIME REMAINING: {Math.max(0, 100 - progress)} SECONDS</p>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 font-medium">Total Assets</p>
                    <Server className="text-blue-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold">{assets.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 font-medium">Critical Risks</p>
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-red-400">{assets.filter(a => a.risk_score >= 100).length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 font-medium">Avg Risk Score</p>
                    <Activity className="text-orange-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-orange-400">
                    {assets.length > 0 ? Math.round(assets.reduce((acc, curr) => acc + curr.risk_score, 0) / assets.length) : 0}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                  <h3 className="text-xl font-bold">Risk-Prioritized Assets</h3>
                  <button onClick={fetchResults} className="text-sm text-blue-400 hover:underline">Refresh Results</button>
                </div>
                {error && <div className="p-4 bg-red-900/30 border-l-4 border-red-500 text-red-200 m-4 rounded">{error}</div>}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Subdomain</th>
                        <th className="px-6 py-4 font-semibold">IP Address</th>
                        <th className="px-6 py-4 font-semibold">Risk Level</th>
                        <th className="px-6 py-4 font-semibold">Stack</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {assets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            {scanStatus === 'scanning' ? 'Mapping attack surface... results will appear shortly.' : 'No assets discovered yet.'}
                          </td>
                        </tr>
                      ) : (
                        assets.map((asset) => {
                          const risk = getRiskLevel(asset.risk_score);
                          return (
                            <tr key={asset.id} className="hover:bg-gray-700/50 transition border-l-2 border-transparent hover:border-blue-500">
                              <td className="px-6 py-4 font-medium text-blue-400">{asset.subdomain}</td>
                              <td className="px-6 py-4 font-mono text-sm">{asset.ip || 'N/A'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${risk.color}`}>
                                  {risk.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {asset.technologies && Object.keys(asset.technologies).length > 0 ? (
                                    Object.keys(asset.technologies).map(tech => (
                                      <span key={tech} className="px-1.5 py-0.5 bg-gray-800 text-blue-300 border border-blue-500/30 rounded text-[9px] font-bold uppercase">
                                        {tech}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-gray-600 italic">No stack detected</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${asset.status === 'up' ? 'bg-green-900/20 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}>
                                  {asset.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === 'network' ? (
            <div className="absolute inset-0 top-[120px] overflow-hidden">
              {assets.length > 0 ? (
                <NetworkMap domain={domain} assets={assets} />
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-700 m-8 rounded-xl bg-gray-800/50">
                  <div className="text-center">
                    <Globe className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Run a scan to visualize the network architecture.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              {domain ? (
                <RiskReport domain={domain} />
              ) : (
                <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50">
                  <p className="text-gray-500 font-bold uppercase tracking-widest">Select a target domain to generate an analysis.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
