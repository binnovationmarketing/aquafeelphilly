import React from 'react';

export interface ReferralNode {
  id: string;
  name: string;
  status: 'PENDING' | 'SCHEDULED' | 'CONVERTED' | 'LOST' | 'HOLD';
  phone?: string;
  created_at: string;
}

interface ReferralTreeProps {
  clientName: string;
  referrals: ReferralNode[];
}

const STATUS_CONFIG: Record<ReferralNode['status'], { color: string; bg: string; label: string; ring: string }> = {
  PENDING:   { color: '#94a3b8', bg: '#1e293b', label: 'Aguardando', ring: '#334155' },
  SCHEDULED: { color: '#60a5fa', bg: '#1e3a5f', label: 'Agendado',   ring: '#3b82f6' },
  CONVERTED: { color: '#11caa0', bg: '#0f3d30', label: 'Convertido', ring: '#11caa0' },
  LOST:      { color: '#f87171', bg: '#3b1111', label: 'Perdido',    ring: '#ef4444' },
  HOLD:      { color: '#fbbf24', bg: '#3b2f0f', label: 'Em Espera',  ring: '#f59e0b' },
};

const NODE_RADIUS = 28;
const TREE_WIDTH = 600;
const ROOT_Y = 60;
const CHILD_Y = 200;
const CHILD_SPACING = 110;

export const ReferralTree: React.FC<ReferralTreeProps> = ({ clientName, referrals }) => {
  const count = referrals.length;

  // Layout
  const totalWidth = Math.max(TREE_WIDTH, count * CHILD_SPACING + 100);
  const rootX = totalWidth / 2;

  // Spread children evenly
  const startX = rootX - ((count - 1) * CHILD_SPACING) / 2;
  const children = referrals.map((ref, i) => ({
    ...ref,
    x: count === 1 ? rootX : startX + i * CHILD_SPACING,
    y: CHILD_Y,
  }));

  const svgHeight = count > 0 ? 310 : 140;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalWidth} ${svgHeight}`}
        width="100%"
        style={{ minWidth: '320px', maxWidth: '100%' }}
        aria-label="Árvore de indicações"
      >
        {/* Root node — the client */}
        <g transform={`translate(${rootX}, ${ROOT_Y})`}>
          {/* Glow ring */}
          <circle r={NODE_RADIUS + 8} fill="none" stroke="#11caa0" strokeWidth={2} opacity={0.3} />
          {/* Main circle */}
          <circle r={NODE_RADIUS} fill="#005088" stroke="#11caa0" strokeWidth={2.5} />
          {/* Icon initials */}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="13"
            fontWeight="800"
            fontFamily="'Outfit', sans-serif"
          >
            {clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </text>

          {/* Label below */}
          <text y={NODE_RADIUS + 18} textAnchor="middle" fill="#11caa0" fontSize="10" fontWeight="700" fontFamily="'Outfit', sans-serif">
            {clientName.split(' ')[0]}
          </text>
          <text y={NODE_RADIUS + 30} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="'Outfit', sans-serif">
            VOCÊ
          </text>
        </g>

        {/* Lines from root to each child */}
        {children.map(child => (
          <g key={`line-${child.id}`}>
            <line
              x1={rootX}
              y1={ROOT_Y + NODE_RADIUS}
              x2={child.x}
              y2={child.y - NODE_RADIUS - 2}
              stroke={STATUS_CONFIG[child.status].ring}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          </g>
        ))}

        {/* Child nodes */}
        {children.map(child => {
          const cfg = STATUS_CONFIG[child.status];
          return (
            <g key={child.id} transform={`translate(${child.x}, ${child.y})`}>
              {/* Status ring */}
              <circle r={NODE_RADIUS + 5} fill="none" stroke={cfg.ring} strokeWidth={1.5} opacity={0.4} />
              {/* Background */}
              <circle r={NODE_RADIUS} fill={cfg.bg} stroke={cfg.ring} strokeWidth={2} />
              {/* Initials */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={cfg.color}
                fontSize="11"
                fontWeight="700"
                fontFamily="'Outfit', sans-serif"
              >
                {child.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </text>

              {/* Name label */}
              <text y={NODE_RADIUS + 16} textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600" fontFamily="'Outfit', sans-serif">
                {child.name.split(' ')[0]}
              </text>
              {/* Status badge */}
              <rect
                x={-28} y={NODE_RADIUS + 24}
                width={56} height={16}
                rx={8}
                fill={cfg.ring}
                opacity={0.2}
              />
              <text y={NODE_RADIUS + 35} textAnchor="middle" fill={cfg.color} fontSize="8" fontWeight="700" fontFamily="'Outfit', sans-serif">
                {cfg.label}
              </text>
            </g>
          );
        })}

        {/* Empty state message */}
        {count === 0 && (
          <g transform={`translate(${rootX}, ${ROOT_Y + 60})`}>
            <text textAnchor="middle" fill="#475569" fontSize="12" fontFamily="'Outfit', sans-serif">
              Sem indicações ainda. Indique sua primeira família!
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2 px-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block border"
              style={{ background: cfg.bg, borderColor: cfg.ring }}
            />
            <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
