/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Override default font sizes completely for kiosk screens
    fontSize: {
      // Much larger sizes for kiosk visibility - doubled most sizes
      'xs': ['20px', { lineHeight: '1.5' }],      // was 12px, now 20px
      'sm': ['24px', { lineHeight: '1.5' }],      // was 14px, now 24px  
      'base': ['28px', { lineHeight: '1.5' }],    // was 16px, now 28px
      'lg': ['32px', { lineHeight: '1.5' }],      // was 18px, now 32px
      'xl': ['36px', { lineHeight: '1.4' }],      // was 20px, now 36px
      '2xl': ['42px', { lineHeight: '1.4' }],     // was 24px, now 42px
      '3xl': ['48px', { lineHeight: '1.3' }],     // was 30px, now 48px
      '4xl': ['56px', { lineHeight: '1.3' }],     // was 36px, now 56px
      '5xl': ['64px', { lineHeight: '1.2' }],     // was 48px, now 64px
      '6xl': ['72px', { lineHeight: '1.1' }],     // was 60px, now 72px
      '7xl': ['80px', { lineHeight: '1.1' }],     // was 72px, now 80px
      '8xl': ['96px', { lineHeight: '1.0' }],     // was 96px, keep large
      '9xl': ['128px', { lineHeight: '1.0' }],    // was 128px, keep large
    },
    extend: {
      // Increase minimum touch targets for kiosk
      minHeight: {
        'touch': '64px',  // Larger touch targets
        'touch-lg': '72px',
        'touch-xl': '80px',
      },
      minWidth: {
        'touch': '64px',  // Larger touch targets  
        'touch-lg': '72px',
        'touch-xl': '80px',
      },
      
      // Larger spacing for kiosk
      spacing: {
        '18': '4.5rem',   // 72px
        '20': '5rem',     // 80px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
    },
  },
  plugins: [],
}