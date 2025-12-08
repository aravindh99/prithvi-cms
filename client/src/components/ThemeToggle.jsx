import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext.jsx';

const baseBtn =
  'flex items-center gap-2 rounded-full px-3 py-2 shadow-lg transition-all duration-200 border';

const ThemeToggle = ({ variant = 'floating' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sharedClasses = isDark
    ? 'bg-slate-800/80 border-slate-700 text-amber-200 hover:border-amber-300 hover:text-white'
    : 'bg-white/90 border-gray-200 text-gray-700 hover:border-slate-400 hover:text-slate-900';

  const content = (
    <>
      {isDark ? <FiSun /> : <FiMoon />}
      <span className="text-xs font-medium">{isDark ? 'Light' : 'Dark'}</span>
    </>
  );

  if (variant === 'inline') {
    return (
      <button onClick={toggleTheme} className={`${baseBtn} ${sharedClasses}`}>
        {content}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`${baseBtn} ${sharedClasses} fixed bottom-5 right-5 z-40 backdrop-blur-sm`}
      aria-label="Toggle theme"
    >
      {content}
    </button>
  );
};

export default ThemeToggle;

