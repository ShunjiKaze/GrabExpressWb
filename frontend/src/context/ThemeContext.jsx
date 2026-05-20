import { createContext, useContext, useState } from 'react';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ge-theme');
    return saved ? saved === 'dark' : true;
  });

  const toggle = () => setDark(d => {
    const next = !d;
    localStorage.setItem('ge-theme', next ? 'dark' : 'light');
    return next;
  });

  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

export const palette = (dark) => ({
  bg1:    dark ? '#0A1223' : '#f4f7f4',
  bg2:    dark ? '#0D1829' : '#ffffff',
  bg3:    dark ? '#070D1A' : '#eaefe9',
  heroGrad: dark
    ? 'linear-gradient(135deg, #0A1223 0%, #0F2040 60%, #003D1F 100%)'
    : 'linear-gradient(135deg, #e8f3ec 0%, #deeaf6 60%, #e0f0e8 100%)',
  heroOverlay: dark
    ? 'linear-gradient(110deg, rgba(10,18,35,0.97) 0%, rgba(10,18,35,0.85) 55%, rgba(10,18,35,0.5) 100%)'
    : 'linear-gradient(110deg, rgba(244,247,244,0.97) 0%, rgba(244,247,244,0.88) 55%, rgba(244,247,244,0.55) 100%)',
  dot: dark
    ? 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)'
    : 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)',
  text:      dark ? '#ffffff' : '#111827',
  textMuted: dark ? 'rgba(255,255,255,0.48)' : '#6b7280',
  textFaint: dark ? 'rgba(255,255,255,0.28)' : '#9ca3af',
  textStat:  dark ? 'rgba(255,255,255,0.5)'  : '#6b7280',
  accent:    dark ? '#4ADE80' : '#00a846',
  cardBg:     dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  cardBorder: dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
  cardHoverBg:     dark ? 'rgba(0,177,79,0.08)' : 'rgba(0,177,79,0.05)',
  cardHoverBorder: dark ? 'rgba(0,177,79,0.3)'  : 'rgba(0,177,79,0.25)',
  featureIconBg:     dark ? 'rgba(0,177,79,0.15)' : 'rgba(0,177,79,0.1)',
  featureIconBorder: dark ? 'rgba(0,177,79,0.2)'  : 'rgba(0,177,79,0.18)',
  floatCardBg:    dark ? 'rgba(10,16,30,0.84)'   : 'rgba(255,255,255,0.97)',
  floatCardBorder: dark ? 'rgba(0,177,79,0.28)'  : 'rgba(0,177,79,0.32)',
  floatText:   dark ? '#ffffff'              : '#111827',
  floatMuted:  dark ? 'rgba(255,255,255,0.4)': '#6b7280',
  floatIconBg: dark ? 'rgba(0,177,79,0.18)'  : 'rgba(0,177,79,0.12)',
  divider:     dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
  accentLine:  dark ? 'rgba(0,177,79,0.3)'   : 'rgba(0,177,79,0.22)',
  fade1: dark ? 'linear-gradient(to bottom, transparent, #0D1829)' : 'linear-gradient(to bottom, transparent, #ffffff)',
  fade2: dark ? 'linear-gradient(to bottom, transparent, #0A1223)' : 'linear-gradient(to bottom, transparent, #f4f7f4)',
  fade3: dark ? 'linear-gradient(to bottom, transparent, #070D1A)' : 'linear-gradient(to bottom, transparent, #eaefe9)',
  navBg:     dark ? 'rgba(10,18,35,0.78)'    : 'rgba(244,247,244,0.9)',
  navBorder: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.08)',
  navLink:   dark ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.65)',
  howBtn: dark
    ? { bg: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.18)' }
    : { bg: 'rgba(17,24,39,0.07)', color: '#111827', border: '1px solid rgba(17,24,39,0.16)' },
  stepIconFirst:  dark ? { bg: '#00b14f', shadow: '0 6px 20px rgba(0,177,79,0.4)' } : { bg: '#00b14f', shadow: '0 6px 20px rgba(0,177,79,0.28)' },
  stepIconRest:   dark ? 'rgba(0,177,79,0.1)'         : 'rgba(0,177,79,0.1)',
  stepIconBorder: dark ? '1.5px solid rgba(0,177,79,0.22)' : '1.5px solid rgba(0,177,79,0.22)',
  stepConnector:  dark ? 'rgba(0,177,79,0.4)'         : 'rgba(0,177,79,0.28)',
  driverBadgeBg:     dark ? 'linear-gradient(135deg, #052e16, #14532d)' : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
  driverBadgeBorder: dark ? 'rgba(0,177,79,0.3)'   : 'rgba(0,177,79,0.35)',
  driverBadgeText:   dark ? '#4ADE80'               : '#065f46',
  driverBadgeLabel:  dark ? 'rgba(255,255,255,0.35)': 'rgba(6,95,70,0.6)',
  driverBadgeSub:    dark ? 'rgba(255,255,255,0.4)' : 'rgba(6,95,70,0.5)',
  driversBadgeBg:    dark ? 'rgba(10,16,30,0.9)'   : 'rgba(255,255,255,0.97)',
  driversBadgeBorder: dark ? 'rgba(255,255,255,0.09)' : '#e5e7eb',
  driversBadgeText:  dark ? 'rgba(255,255,255,0.8)' : '#374151',
  alreadyDriverBg:    dark ? 'rgba(0,177,79,0.15)' : 'rgba(0,177,79,0.1)',
  alreadyDriverBorder: dark ? 'rgba(0,177,79,0.35)': 'rgba(0,177,79,0.3)',
  alreadyDriverText:  dark ? '#4ADE80'              : '#065f46',
  infoCardBg:     dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  infoCardBorder: dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
  infoLabel:      dark ? 'rgba(255,255,255,0.3)'  : '#9ca3af',
  infoValue:      dark ? 'rgba(255,255,255,0.7)'  : '#374151',
  formCardBg:     dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  formCardBorder: dark ? 'rgba(255,255,255,0.09)' : '#e5e7eb',
  formLabel:      dark ? 'rgba(255,255,255,0.55)' : '#6b7280',
  formInputBg:    dark ? 'rgba(255,255,255,0.07)' : '#f9fafb',
  formInputBorder: dark ? 'rgba(255,255,255,0.13)': '#d1d5db',
  formInputText:  dark ? '#ffffff'                : '#111827',
  formPlaceholder: dark ? 'rgba(255,255,255,0.25)': '#9ca3af',
  faqBorder:          dark ? 'rgba(255,255,255,0.07)' : '#e5e7eb',
  faqContainerBg:     dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
  faqContainerBorder: dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
  faqCatLabel:   dark ? 'rgba(255,255,255,0.25)' : '#9ca3af',
  faqCatInactive: dark ? 'rgba(255,255,255,0.45)': '#6b7280',
  faqCount:      dark ? 'rgba(255,255,255,0.3)'  : '#9ca3af',
  helpBox:       dark ? 'rgba(0,177,79,0.07)'    : 'rgba(0,177,79,0.06)',
  helpBoxBorder: dark ? 'rgba(0,177,79,0.18)'    : 'rgba(0,177,79,0.22)',
  helpBoxTitle:  dark ? '#ffffff'                 : '#111827',
  helpBoxText:   dark ? 'rgba(255,255,255,0.4)'  : '#6b7280',
  learnMoreBg:    dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.06)',
  learnMoreColor: dark ? 'rgba(255,255,255,0.7)'  : '#374151',
  learnMoreBorder: dark ? 'rgba(255,255,255,0.15)': '#d1d5db',
  learnMoreHover: dark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.1)',
  footerBg:     dark ? '#040810'                : '#dce8dc',
  footerBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
  footerText:   dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.38)',
});
