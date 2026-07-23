export function ProcessingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          border: '3px solid rgba(245,160,40,.2)',
          borderTopColor: '#F5A028',
          animation: 'spin .85s linear infinite',
        }}
      />
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Grouping photos by pose…</div>
        <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.45)', marginTop: 6 }}>Solo · Couple · Group · Candid</div>
      </div>
    </div>
  );
}
