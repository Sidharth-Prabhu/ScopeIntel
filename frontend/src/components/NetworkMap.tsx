import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Search, Activity } from 'lucide-react';

interface Asset {
  id: number;
  subdomain: string;
  ip: string;
  status: string;
  risk_score: number;
}

interface NetworkMapProps {
  domain: string;
  assets: Asset[];
}

const NetworkMap: React.FC<NetworkMapProps> = ({ domain, assets }) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!domain || assets.length === 0) return;

    const nodes: any[] = [];
    const links: any[] = [];

    nodes.push({
      id: domain,
      name: domain,
      val: 15,
      color: '#3b82f6',
      type: 'root'
    });

    const ipMap = new Map();

    assets.forEach(asset => {
      nodes.push({
        id: asset.subdomain,
        name: asset.subdomain,
        val: 8,
        color: asset.risk_score >= 100 ? '#ef4444' : asset.risk_score >= 50 ? '#f97316' : '#60a5fa',
        type: 'subdomain'
      });

      links.push({
        source: domain,
        target: asset.subdomain
      });

      if (asset.ip) {
        if (!ipMap.has(asset.ip)) {
          ipMap.set(asset.ip, true);
          nodes.push({
            id: asset.ip,
            name: asset.ip,
            val: 6,
            color: '#10b981',
            type: 'ip'
          });
        }
        
        links.push({
          source: asset.subdomain,
          target: asset.ip
        });
      }
    });

    setGraphData({ nodes, links });
  }, [domain, assets]);

  // Real-time Search Logic
  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = graphData.nodes.filter((node: any) => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, graphData.nodes]);

  const handleNodeClick = (node: any) => {
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(5.0, 1000);
    }
    
    const assetData = assets.find(a => a.subdomain === node.id);
    setSelectedNode({ ...node, assetData });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0b0f19]">
      {/* Immersive Search Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[450px] group">
        <div className="relative">
          <input
            type="text"
            placeholder="Search nodes (e.g. staging-api.target.com)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/80 backdrop-blur-xl border border-gray-700 text-white rounded-2xl py-4 px-14 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all"
          />
          <Search className="absolute left-5 top-4.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={22} />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-gray-900/95 backdrop-blur-2xl border border-gray-700 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              {searchResults.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="w-full text-left px-6 py-4 hover:bg-blue-600/20 flex items-center justify-between group/item transition border-b border-gray-800 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover/item:text-blue-400 transition-colors">{node.name}</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em] mt-0.5">{node.type}</span>
                  </div>
                  <Activity size={16} className="text-gray-700 group-hover/item:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-6 left-6 z-10 p-4 bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl pointer-events-none">
        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">Map Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] text-gray-300 font-bold uppercase">Root Domain</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-300"></div>
            <span className="text-[10px] text-gray-300 font-bold uppercase">Subdomain</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-gray-300 font-bold uppercase">IP Address</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] text-red-400 font-bold uppercase">Critical Risk</span>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {selectedNode && (
        <div className="absolute top-6 right-6 z-20 w-80 bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-[0_0_40px_rgba(0,0,0,0.7)] p-7 transition-all animate-in slide-in-from-right-10 duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Entity Details</span>
              <h3 className="text-xl font-bold text-white truncate w-60">{selectedNode.name}</h3>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1.5">Classification</span>
              <span className="text-sm text-blue-400 font-bold capitalize">{selectedNode.type}</span>
            </div>

            {selectedNode.assetData ? (
              <>
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1.5">Network Address</span>
                  <span className="text-sm font-mono text-gray-200">{selectedNode.assetData.ip || 'UNRESOLVED'}</span>
                </div>
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1.5">Threat Score</span>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <div className={`px-3 py-1 rounded-lg text-xs font-black ${selectedNode.assetData.risk_score >= 100 ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {selectedNode.assetData.risk_score} / 200
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedNode.assetData.risk_score >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (selectedNode.assetData.risk_score / 200) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 italic text-xs text-gray-500 leading-relaxed">
                This is the root infrastructure node. All sub-assets are mapped relative to this entry point.
              </div>
            )}
            
            <button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-black tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
              onClick={() => {
                if (fgRef.current) {
                  fgRef.current.centerAt(0, 0, 1000);
                  fgRef.current.zoom(1, 1000);
                }
              }}
            >
              RESET VIEWPORT
            </button>
          </div>
        </div>
      )}

      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0b0f19"
          onNodeClick={handleNodeClick}
          nodeLabel="name"
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={() => "#ffffff"}
          linkDirectionalParticleWidth={2}
          linkColor={() => "rgba(255, 255, 255, 0.2)"}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;

            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();

            // Selection ring
            if (node.id === selectedNode?.id) {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 3 / globalScale;
              ctx.stroke();
              
              // Animated outer pulse
              const pulse = (Date.now() / 500) % 2;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 1 / globalScale;
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val + 2 + pulse, 0, 2 * Math.PI, false);
              ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(label, node.x, node.y + node.val + 5);
          }}
        />
      )}
    </div>
  );
};

export default NetworkMap;
