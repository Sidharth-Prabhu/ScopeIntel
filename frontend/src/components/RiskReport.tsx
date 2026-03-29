import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Info, Download, Calendar, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RiskReportPDF from './RiskReportPDF';

// ... (Finding and ReportData interfaces remain the same)

const RiskReport: React.FC<{ domain: string }> = ({ domain }) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/results/${domain}/risks`);
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch risk report");
      } finally {
        setLoading(false);
      }
    };
    if (domain) fetchReport();
  }, [domain]);

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Generating Report Intelligence...</p>
      </div>
    </div>
  );

  if (!data || data.findings.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 py-20">
      <ShieldAlert size={64} className="text-gray-700" />
      <p className="text-xl font-medium">No significant risks detected for this domain.</p>
      <p className="text-sm italic text-gray-600 text-center max-w-md">Risk reporting requires a completed scan with vulnerabilities discovered.</p>
    </div>
  );

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end sticky top-0 z-10 py-4 bg-gray-900/80 backdrop-blur-md">
        <PDFDownloadLink 
          document={<RiskReportPDF data={data} />} 
          fileName={`Security_Report_${domain}.pdf`}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center hover:bg-blue-500 transition shadow-xl"
        >
          {({ loading: pdfLoading }) => (
            pdfLoading ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> PREPARING PDF...</>
            ) : (
              <><Download size={16} className="mr-2" /> DOWNLOAD BRANDED AUDIT (PDF)</>
            )
          )}
        </PDFDownloadLink>
      </div>

      <div className="p-10 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl space-y-10">
... (rest of the component UI remains the same)
        {/* Executive Header with Branding */}
        <div className="flex justify-between items-start border-b-2 border-blue-500/20 pb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-blue-400/30">
                <ShieldAlert size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter italic">SCOPE<span className="text-blue-500">INTEL</span></h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Advanced Attack Surface Intelligence</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-blue-500 font-black text-xs uppercase tracking-[0.5em] block mb-2">Internal Security Audit</span>
              <h1 className="text-6xl font-black text-white leading-tight">Infrastructure <br/>Risk Analysis</h1>
            </div>
          </div>

          <div className="text-right relative z-10">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl space-y-4 shadow-xl">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Target Infrastructure</p>
                <p className="text-lg font-bold text-blue-400 font-mono underline decoration-blue-500/30 underline-offset-4">{data.domain}</p>
              </div>
              <div className="h-px bg-gray-700 w-full"></div>
              <div className="flex justify-end space-x-8">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Report ID</p>
                  <p className="text-xs font-mono text-gray-300">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Date</p>
                  <p className="text-xs font-mono text-gray-300">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Confidential Badge */}
            <div className="mt-6 flex justify-end">
              <div className="inline-flex items-center px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3"></div>
                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest text-right">Strictly Confidential</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Critical findings', count: data.critical_count, color: 'bg-red-500', shadow: 'shadow-red-500/20' },
            { label: 'High findings', count: data.high_count, color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
            { label: 'Medium findings', count: data.medium_count, color: 'bg-yellow-500', shadow: 'shadow-yellow-500/20' },
            { label: 'Low findings', count: data.low_count, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
          ].map((item) => (
            <div key={item.label} className={`bg-gray-800/40 border border-gray-700/50 p-8 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:bg-gray-800/60 ${item.shadow} shadow-lg`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${item.color}`}></div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{item.label}</p>
              <p className="text-4xl font-black text-white leading-none">{item.count}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 via-gray-800/20 to-transparent border border-blue-500/20 p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Info size={24} className="text-blue-500 mr-3" /> Executive Intelligence Summary
          </h3>
          <p className="text-gray-400 leading-relaxed text-base font-medium">
            An automated audit of <span className="text-white font-black underline decoration-blue-500/50">{data.domain}</span> infrastructure was completed on <span className="text-white">{data.scan_date ? new Date(data.scan_date).toLocaleString() : 'Recently'}</span>. 
            The system analyzed <span className="text-white font-bold">{data.total_assets} unique subdomains and IP addresses</span>. 
            The assessment identified <span className="text-red-500 font-black">{data.critical_count} critical-severity vulnerabilities</span> that expose the organization to significant risk.
            The overall posture is classified as <span className={`px-3 py-1 rounded-lg font-black text-sm ml-2 ${data.critical_count > 0 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
              {data.critical_count > 0 ? 'HIGH THREAT LEVEL' : 'ELEVATED THREAT LEVEL'}
            </span>.
          </p>
        </div>

        <div className="space-y-6 pb-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight">Technical Vulnerability Inventory</h3>
            <div className="h-px flex-1 bg-gray-800 mx-8"></div>
          </div>
          
          {data.findings.map((finding, idx) => (
            <div key={idx} className="bg-gray-800/20 border border-gray-800 rounded-[2rem] overflow-hidden hover:border-gray-700 transition-all duration-300">
              <div className="p-8 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                  <div className={`px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-widest shadow-lg ${getSeverityColor(finding.severity)}`}>
                    {finding.severity}
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-bold tracking-tight">{finding.type}</h4>
                    <p className="text-blue-400 font-mono text-xs mt-1.5 font-bold uppercase tracking-wider">{finding.subdomain} • {finding.ip || 'INTERNAL'}</p>
                  </div>
                </div>
              </div>
              <div className="px-8 pb-8 pt-6 border-t border-gray-800/50 bg-gray-900/40">
                <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/30">
                  <p className="text-gray-400 text-sm leading-relaxed font-medium">{finding.description}</p>
                </div>
                <div className="flex space-x-4 mt-6">
                  <div className="bg-gray-800/80 px-4 py-2 rounded-xl text-[10px] text-gray-400 font-black uppercase tracking-widest border border-gray-700/50">STATUS: REMEDIATION PENDING</div>
                  <div className="bg-gray-800/80 px-4 py-2 rounded-xl text-[10px] text-gray-400 font-black uppercase tracking-widest border border-gray-700/50">DETECTED: {new Date(finding.discovered_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-10 flex justify-between items-center text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
          <span>Generated by AMASS Enterprise Intelligence</span>
          <span>Confidential • Internal Use Only</span>
        </div>
      </div>
    </div>
  );
};

export default RiskReport;
