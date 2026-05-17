function Logo({ size = 'md', showText = true, textColor = '#0F172A' }) {
  const dims = { sm: 28, md: 36, lg: 48 };
  const px = dims[size] ?? 36;
  const textSize = { sm: '15px', md: '19px', lg: '26px' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: px * 0.28 + 'px' }}>
      {/* Icon mark */}
      <svg width={px} height={px} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#00B14F" />

        {/* Speed lines — left side */}
        <line x1="4"  y1="12" x2="13" y2="12" stroke="white" strokeWidth="2"   strokeLinecap="round" opacity="0.45" />
        <line x1="4"  y1="18" x2="13" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4"  y1="24" x2="13" y2="24" stroke="white" strokeWidth="2"   strokeLinecap="round" opacity="0.45" />

        {/* Chevron arrow — right side */}
        <path d="M15 9L27 18L15 27" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span style={{
          fontSize: textSize[size] ?? '19px',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: textColor,
          lineHeight: 1,
          userSelect: 'none',
        }}>
          Grab<span style={{ color: '#00B14F' }}>Express</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
