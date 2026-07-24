import { useEffect, useState } from 'react';

const STAGES = [
  { label: 'Scanning all photos…', sub: 'Reading poses and backgrounds' },
  { label: 'Analysing compositions…', sub: 'Comparing framing and subjects' },
  { label: 'Finding similar shots…', sub: 'Matching 80–100% pose similarity' },
  { label: 'Grouping by location…', sub: 'Checking background and setting' },
  { label: 'Naming groups…', sub: 'Creating descriptive labels' },
  { label: 'Almost done…', sub: 'Finalising your groups' },
];

export function ProcessingScreen() {
  const [stageIndex, setStageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
        setFade(true);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[stageIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 24,
        textAlign: 'center',
      }}
    >
      {/* Spinner */}
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid rgba(245,160,40,.12)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid transparent',
            borderTopColor: '#F5A028',
            borderRadius: '50%',
            animation: 'spin .9s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 6,
            border: '1.5px solid transparent',
            borderTopColor: 'rgba(245,160,40,.4)',
            borderRadius: '50%',
            animation: 'spin 1.4s linear infinite reverse',
          }}
        />
      </div>

      {/* Stage label */}
      <div
        style={{
          transition: 'opacity .3s ease',
          opacity: fade ? 1 : 0,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {stage.label}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>
          {stage.sub}
        </div>
      </div>

      {/* Stage dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {STAGES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === stageIndex ? 18 : 5,
              height: 5,
              borderRadius: 3,
              background: i === stageIndex ? '#F5A028' : i < stageIndex ? 'rgba(245,160,40,.35)' : 'rgba(255,255,255,.12)',
              transition: 'all .3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
