
import React, { useMemo, useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { TeamMember } from '../types';

// Adicione esta função após os imports e antes do componente
const extractTransform = (transformString: string | null) => {
  if (!transformString) return { x: 0, y: 0, k: 1 };

  let x = 0, y = 0, k = 1;

  // Extrair translate(x,y)
  const translateMatch = transformString.match(/translate\(([^,]+),([^)]+)\)/);
  if (translateMatch) {
    x = parseFloat(translateMatch[1]);
    y = parseFloat(translateMatch[2]);
  }

  // Extrair scale(k)
  const scaleMatch = transformString.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    k = parseFloat(scaleMatch[1]);
  }

  return { x, y, k };
};

interface OrgChartProps {
  members: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  onAddSubordinate: (parentId: string) => void;
  onDeleteMember: (id: string) => void;
  isEditing: boolean;
}

export interface OrgChartRef {
  resetLayout: () => void;
  getSVGElement: () => {
    svgElement: SVGSVGElement | null;
    getCurrentTransform: () => { x: number; y: number; k: number };
  };
}

const OrgChart = forwardRef<OrgChartRef, OrgChartProps>(({ members, onSelectMember, onAddSubordinate, onDeleteMember, isEditing }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });
  const [dragOffsets, setDragOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Função auxiliar para determinar o nível com base no cargo
  const getRoleLevel = (role: string): number => {
    const r = role.toLowerCase();
    if (r.includes('gerente')) return 0;
    if (r.includes('coordenador')) return 1;
    if (r.includes('analista')) return 2;
    if (r.includes('técnico') || r.includes('tecnico') || r.includes('tec ')) return 3;  // ← TÉCNICOS
    if (r.includes('inspetor') || r.includes('atendente')) return 4;  // ← INSPETORES
    return 5;
  };

  // No OrgChart.tsx, substitua o useImperativeHandle atual por este:
  useImperativeHandle(ref, () => {
    console.log('🔄 OrgChart ref expondo funções:', {
      resetLayout: true,
      getSVGElement: true
    });

    return {
      resetLayout: () => {
        setDragOffsets({});

        if (svgRef.current && containerRef.current && zoomRef.current) {
          const width = containerRef.current.clientWidth;
          const initialTransform = d3.zoomIdentity
            .translate(width / 2, 100)
            .scale(0.55);

          d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomRef.current.transform as any, initialTransform);
        }
      },

      getSVGElement: () => {
        // IMPORTANTE: Retornar tanto o elemento quanto as transformações atuais
        const svg = svgRef.current;
        if (!svg) return { svgElement: null, getCurrentTransform: () => ({ x: 0, y: 0, k: 1 }) };

        // Obter as transformações atuais do grupo principal
        const getCurrentTransform = () => {
          const mainGroup = svg.querySelector('g.main-group');
          if (!mainGroup) return { x: 0, y: 0, k: 1 };

          const transform = mainGroup.getAttribute('transform');
          if (!transform) return { x: 0, y: 0, k: 1 };

          let x = 0, y = 0, k = 1;

          // Extrair translate(x,y)
          const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (translateMatch) {
            x = parseFloat(translateMatch[1]);
            y = parseFloat(translateMatch[2]);
          }

          // Extrair scale(k)
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          if (scaleMatch) {
            k = parseFloat(scaleMatch[1]);
          }

          console.log('📐 Transformações atuais:', { x, y, k });
          return { x, y, k };
        };

        console.log('📄 Retornando SVG element com transformações');
        return {
          svgElement: svg,
          getCurrentTransform: getCurrentTransform
        };
      }
    };
  }, []);

  const root = useMemo(() => {
    if (members.length === 0) return null;
    try {
      const memberIds = new Set(members.map(m => m.id));
      const safeMembers = members.map(m => ({
        ...m,
        parentId: memberIds.has(m.parentId || '') ? m.parentId : null
      }));

      const stratify = d3.stratify<TeamMember>()
        .id(d => d.id)
        .parentId(d => d.parentId);

      const hierarchy = stratify(safeMembers);

      const nodeWidth = 300;
      const levelHeight = 320; // Espaçamento vertical fixo entre níveis

      const treeLayout = d3.tree<TeamMember>()
        .nodeSize([nodeWidth, levelHeight])
        .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3));

      const treeData = treeLayout(hierarchy);

      // FORÇAR NÍVEIS HORIZONTAIS
      // Independentemente da profundidade do nó na árvore D3, 
      // forçamos o 'y' baseado no nível real do cargo.
      treeData.descendants().forEach(node => {
        const roleLevel = getRoleLevel(node.data.role);
        node.y = roleLevel * levelHeight;
      });

      return treeData;
    } catch (e) {
      console.warn("Hierarchy error", e);
      return null;
    }
  }, [members]);

  useEffect(() => {
    if (!root || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.main-group');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior as any);

    if (zoom.k === 1 && zoom.x === 0) {
      const initialTransform = d3.zoomIdentity.translate((width / 2), 100).scale(0.55);
      svg.call(zoomBehavior.transform as any, initialTransform);
    }

    if (isEditing) {
      const drag = d3.drag<SVGGElement, any>()
        .on('drag', (event, d) => {
          if (!d || !d.data || !d.data.id) return;

          const id = d.data.id;
          const idsToMove = selectedIds.has(id) ? Array.from(selectedIds) : [id];

          setDragOffsets(prev => {
            const next = { ...prev };
            idsToMove.forEach(mid => {
              next[mid] = {
                dx: (prev[mid]?.dx || 0) + event.dx,
                dy: (prev[mid]?.dy || 0) + event.dy
              };
            });
            return next;
          });
        });

      const allNodes = root.descendants();
      d3.selectAll<SVGGElement, any>('.org-node')
        .each(function () {
          const el = d3.select(this);
          const id = el.attr('data-id');
          const d = allNodes.find(n => n.id === id);
          if (d) {
            el.datum(d).call(drag as any);
          }
        });
    }

  }, [root, dragOffsets, isEditing, selectedIds]);

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    if (!isEditing) return;
    e.stopPropagation();

    if (e.shiftKey) {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const clearSelection = () => {
    if (selectedIds.size > 0) setSelectedIds(new Set());
  };

  if (!root) return null;

  const nodes = root.descendants();
  const links = root.links();

  const getRectilinearPath = (link: any) => {
    const sdx = dragOffsets[link.source.id]?.dx || 0;
    const sdy = dragOffsets[link.source.id]?.dy || 0;
    const tdx = dragOffsets[link.target.id]?.dx || 0;
    const tdy = dragOffsets[link.target.id]?.dy || 0;

    const sourceX = link.source.x + sdx;
    const sourceY = link.source.y + sdy + 120;
    const targetX = link.target.x + tdx;
    const targetY = link.target.y + tdy - 40;

    const midY = (sourceY + targetY) / 2;
    return `M${sourceX},${sourceY} V${midY} H${targetX} V${targetY}`;
  };

  return (
    <div
      id="org-chart-container"
      ref={containerRef}
      onClick={clearSelection}
      className="w-full h-full bg-[#f8fafc] relative overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ overflow: 'visible' }} // Garante que elementos fora da visão atual existam na DOM para serem clonados
      >
        <defs>
          <clipPath id="nodeAvatarClip">
            <rect width="50" height="50" rx="16" />
          </clipPath>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dx="0" dy="12" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.08" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* O D3.js vai inserir o <g> do zoom aqui embaixo automaticamente */}
        <g className="main-group">
          {links.map((link, i) => (
            <path
              key={`link-${i}`}
              d={getRectilinearPath(link)}
              fill="none"
              stroke={!isEditing ? "#f9731633" : "#cbd5e1"}
              strokeWidth="2.5"
              className="org-link"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {nodes.map((node) => {
            if (!node.id) return null;

            const cardWidth = 240;
            const focusCount = (node.data.focus && node.data.focus.length) || 0;
            const cardHeight = focusCount > 0 ? (120 + Math.min(focusCount, 4) * 20 + 20) : 120;
            const dx = dragOffsets[node.id]?.dx || 0;
            const dy = dragOffsets[node.id]?.dy || 0;
            const isSelected = selectedIds.has(node.id);

            return (
              <g
                key={`node-${node.id}`}
                data-id={node.id}
                transform={`translate(${node.x - (cardWidth / 2) + dx}, ${node.y - 40 + dy})`}
                className={`org-node select-none group transition-all duration-500 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={(e) => handleNodeClick(e, node.id!)}
              >
                {isSelected && (
                  <rect
                    width={cardWidth + 16}
                    height={cardHeight + 16}
                    x="-8"
                    y="-8"
                    rx="32"
                    fill="none"
                    stroke={!isEditing ? "#f97316" : "#64748b"}
                    strokeWidth="4"
                    className="animate-pulse"
                  />
                )}

                <rect
                  width={cardWidth}
                  height={cardHeight}
                  rx="24"
                  fill="white"
                  stroke={isSelected ? (!isEditing ? "#f97316" : "#64748b") : "#f1f5f9"}
                  strokeWidth="2"
                  filter="url(#softShadow)"
                  className="transition-all"
                />

                <rect width={cardWidth} height="8" rx="4" fill={!isEditing ? "#f97316" : "#94a3b8"} />

                <g transform="translate(15, 25)">
                  <rect width="50" height="50" rx="16" fill="#f8fafc" stroke="#f1f5f9" strokeWidth="1" />
                  {node.data.photo ? (
                    <image href={node.data.photo} width="50" height="50" clipPath="url(#nodeAvatarClip)" preserveAspectRatio="xMidYMid slice" />
                  ) : (
                    <text x="25" y="32" textAnchor="middle" fontSize="20" fontWeight="900" fill="#cbd5e1" className="uppercase">
                      {node.data.name.charAt(0)}
                    </text>
                  )}
                </g>

                <g transform="translate(75, 42)">
                  <text fontSize="14" fontWeight="900" fill="#1e293b" className="tracking-tight uppercase">
                    {node.data.name}
                  </text>
                  <text y="18" fontSize="10" fontWeight="800" fill={!isEditing ? "#f97316" : "#94a3b8"} className="uppercase tracking-[0.15em]">
                    {node.data.role.split(' ')[0]}
                  </text>
                </g>

                {focusCount > 0 && (
                  <g transform="translate(15, 100)">
                    <rect width={cardWidth - 30} height="1" fill="#f1f5f9" />
                    <text y="20" fontSize="9" fontWeight="900" fill="#cbd5e1" className="uppercase tracking-widest">Atribuições:</text>
                    {node.data.focus && node.data.focus.slice(0, 4).map((item, idx) => (
                      <g key={idx} transform={`translate(0, ${40 + (idx * 20)})`}>
                        <circle cx="5" cy="-5" r="3" fill={!isEditing ? "#f97316" : "#94a3b8"} className="opacity-80" />
                        <text x="16" y="0" fontSize="10" fontWeight="700" fill="#475569">
                          {item.length > 28 ? item.substring(0, 25) + '...' : item}
                        </text>
                      </g>
                    ))}
                  </g>
                )}

                {isEditing && (
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity no-print">
                    <g transform={`translate(${cardWidth - 30}, ${cardHeight - 30})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onAddSubordinate(node.id!); }}>
                      <circle r="20" fill="#94a3b8" className="shadow-lg hover:fill-slate-700 transition-colors" />
                      <text textAnchor="middle" dy=".35em" fill="white" fontSize="24" fontWeight="900">+</text>
                    </g>

                    <g transform={`translate(${cardWidth / 2 - 45}, ${cardHeight - 50})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteMember(node.id!); }}>
                      <rect width="90" height="36" rx="18" fill="white" stroke="#fee2e2" strokeWidth="2.5" className="shadow-lg hover:fill-rose-50 transition-colors" />
                      <text x="45" y="23" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="900" className="uppercase tracking-widest">EXCLUIR</text>
                    </g>

                    <g transform={`translate(30, ${cardHeight - 30})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectMember(node.data); }}>
                      <circle r="20" fill="white" stroke="#f1f5f9" strokeWidth="2.5" className="shadow-lg hover:border-slate-300 transition-colors" />
                      <text textAnchor="middle" dy=".35em" fill="#64748b" className="fa-solid fa-pen" style={{ fontFamily: '"Font Awesome 6 Free"', fontWeight: 900, fontSize: '12px' }}>&#xf304;</text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-10 left-10 flex flex-col gap-4 no-print animate-in fade-in slide-in-from-left duration-700">
        <div className="group bg-white/90 backdrop-blur-md p-2 rounded-[28px] border border-white shadow-2xl flex items-center gap-0 hover:gap-5 transition-all duration-500 max-w-[56px] hover:max-w-md overflow-hidden cursor-help">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex shrink-0 items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors duration-300">
            <i className="fa-solid fa-lightbulb text-lg"></i>
          </div>
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pr-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dica Profissional</span>
            <span className="text-xs font-bold text-slate-700">Use <span className={`${!isEditing ? 'text-orange-500' : 'text-slate-600'} font-black`}>SHIFT + Clique</span> para agrupar membros.</span>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className={`${!isEditing ? 'bg-orange-500' : 'bg-slate-600'} text-white px-8 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce`}>
            <i className="fa-solid fa-object-group"></i>
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.size} Integrantes em Lote</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default OrgChart;
