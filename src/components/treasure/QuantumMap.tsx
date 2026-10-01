import type { HuntState } from '../../services/treasureHunt';
import css from '../../pages/TreasureHunt.module.css';

// 3 branches, 6 nodes each. Total 18.
const MAP_NODES = [
  // Branch 1: Cyan (Top Left -> Center)
  { id: 'ch-01', x: 150, y: 150, codeIdx: 0, label: 'SAC BUILDING' },
  { id: 'ch-02', x: 250, y: 120, codeIdx: 0, label: 'AB-1' },
  { id: 'ch-03', x: 350, y: 180, codeIdx: 0, label: 'AB-2' },
  { id: 'ch-04', x: 220, y: 260, codeIdx: 0, label: 'AB-3' },
  { id: 'ch-05', x: 320, y: 340, codeIdx: 0, label: 'FOOD COURT' },
  { id: 'ch-06', x: 380, y: 380, codeIdx: 0, label: 'LIBRARY' },

  // Branch 2: Violet (Top Right -> Center)
  { id: 'ch-07', x: 650, y: 150, codeIdx: 1, label: 'SUBSTATION' },
  { id: 'ch-08', x: 550, y: 120, codeIdx: 1, label: 'HOSPITAL' },
  { id: 'ch-09', x: 450, y: 180, codeIdx: 1, label: 'MESS 1' },
  { id: 'ch-10', x: 580, y: 260, codeIdx: 1, label: 'MESS 2' },
  { id: 'ch-11', x: 480, y: 340, codeIdx: 1, label: 'MESS 3' },
  { id: 'ch-12', x: 420, y: 380, codeIdx: 1, label: 'MESS 4' },

  // Branch 3: Blue (Bottom -> Center)
  { id: 'ch-13', x: 400, y: 700, codeIdx: 2, label: 'MESS 5' },
  { id: 'ch-14', x: 250, y: 600, codeIdx: 2, label: 'MESS 6' },
  { id: 'ch-15', x: 550, y: 550, codeIdx: 2, label: 'SPORTS GROUND' },
  { id: 'ch-16', x: 300, y: 480, codeIdx: 2, label: 'ADMIN' },
  { id: 'ch-17', x: 500, y: 450, codeIdx: 2, label: 'AUDITORIUM' },
  { id: 'ch-18', x: 400, y: 420, codeIdx: 2, label: 'MAIN GATE' },
];

const CODE_COLORS = ['var(--qh-accent)', 'var(--qh-accent2)', 'var(--qh-accent3)'];

export default function QuantumMap({ huntState, onNodeTap }: { huntState: HuntState, onNodeTap: (id: string) => void }) {
  const completed = huntState.completedChallengeIds;

  const renderPath = (nodes: typeof MAP_NODES, color: string) => {
    return nodes.map((node, i) => {
      if (i === nodes.length - 1) return null;
      const next = nodes[i + 1];
      const isCompleted = completed.includes(node.id) && completed.includes(next.id);
      const isCurrent = completed.includes(node.id) && !completed.includes(next.id);
      
      const pathClass = isCompleted ? css.qPathComplete : isCurrent ? css.qPathActive : css.qPathBase;
      const d = `M ${node.x} ${node.y} C ${node.x} ${node.y + (next.y - node.y)/2} ${next.x} ${next.y - (next.y - node.y)/2} ${next.x} ${next.y}`;
      
      return (
        <path key={`path-${node.id}`} d={d} className={pathClass} style={{ color }} />
      );
    });
  };

  const b1 = MAP_NODES.slice(0, 6);
  const b2 = MAP_NODES.slice(6, 12);
  const b3 = MAP_NODES.slice(12, 18);

  return (
    <div className={css.centerCol}>
      <svg viewBox="0 0 800 800" className={css.mapSvg} preserveAspectRatio="xMidYMid meet">
        {/* Campus Background Buildings (Stylized) */}
        <rect x="100" y="100" width="100" height="80" className={css.campusBldg} rx="4" />
        <rect x="200" y="80" width="80" height="60" className={css.campusBldg} rx="4" />
        <rect x="320" y="150" width="60" height="60" className={css.campusBldg} rx="4" />
        <rect x="180" y="240" width="80" height="40" className={css.campusBldg} rx="4" />
        <circle cx="320" cy="340" r="30" className={css.campusBldg} />
        <rect x="350" y="360" width="60" height="40" className={css.campusBldg} rx="4" />

        <rect x="620" y="120" width="60" height="60" className={css.campusBldg} rx="4" />
        <rect x="520" y="100" width="60" height="80" className={css.campusBldg} rx="4" />
        <rect x="420" y="160" width="80" height="40" className={css.campusBldg} rx="4" />
        <rect x="550" y="240" width="60" height="60" className={css.campusBldg} rx="4" />
        <rect x="450" y="320" width="60" height="60" className={css.campusBldg} rx="4" />
        <rect x="390" y="360" width="60" height="40" className={css.campusBldg} rx="4" />

        <rect x="350" y="680" width="100" height="60" className={css.campusBldg} rx="4" />
        <rect x="200" y="580" width="80" height="60" className={css.campusBldg} rx="4" />
        <circle cx="550" cy="550" r="40" className={css.campusGrass} stroke="var(--qh-border)" strokeWidth="1.5" />
        <rect x="270" y="460" width="60" height="40" className={css.campusBldg} rx="4" />
        <polygon points="500,430 530,470 470,470" className={css.campusBldg} />
        <path d="M 380 410 L 420 410 L 410 430 L 390 430 Z" className={css.campusBldg} />

        {/* Paths */}
        {renderPath(b1, CODE_COLORS[0])}
        {renderPath(b2, CODE_COLORS[1])}
        {renderPath(b3, CODE_COLORS[2])}

        {/* Nodes */}
        {MAP_NODES.map((node) => {
          const color = CODE_COLORS[node.codeIdx];
          const isCompleted = completed.includes(node.id);
          // Find first uncompleted node in its branch
          const branch = MAP_NODES.filter(n => n.codeIdx === node.codeIdx);
          const currentInBranch = branch.find(n => !completed.includes(n.id));
          const isCurrent = currentInBranch?.id === node.id;
          // Let's simplify: completed, current, locked
          const stateClass = isCompleted ? css.nodeCompleted : isCurrent ? css.nodeCurrent : css.nodeLocked;

          return (
            <foreignObject key={node.id} x={node.x - 30} y={node.y - 30} width="60" height="60" style={{ overflow: 'visible' }}>
              <div
                className={css.nodeWrap}
                style={{ width: '100%', height: '100%', left: '50%', top: '50%' }}
                onClick={() => onNodeTap(node.id)}
              >
                <div className={`${css.nodeBase} ${stateClass}`} style={{ width: 16, height: 16, color }}>
                  {isCurrent && (
                    <div className={css.orbitRing}>
                      <div className={css.orbitDot} />
                    </div>
                  )}
                </div>
                <div className={css.nodeLabel}>{node.label}</div>
              </div>
            </foreignObject>
          );
        })}
        
        {/* Quantum Core Convergence (Center) */}
        {completed.length === 18 && (
          <circle cx="400" cy="400" r="20" fill="var(--qh-accent)" opacity="0.8">
            <animate attributeName="r" values="20; 25; 20" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}
