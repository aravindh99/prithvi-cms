import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Layout from '../../components/Layout.jsx';
import { FaSignOutAlt } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext.jsx';

// Helper to format a JS Date as YYYY-MM-DD using local time (no UTC shift)
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CalendarSelection = () => {
  const { selectedDates, setSelectedDates, selectedProducts, calculatePerDayTotal } = useOrder();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState([]);
  const [selectAllMonth, setSelectAllMonth] = useState(false);
  const { isDark } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Keep select-all checkbox in sync with current month + selectedDates
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) {
        monthDates.push(toLocalDateString(date));
      }
    }

    const allSelected = monthDates.length > 0 && monthDates.every(d => selectedDates.includes(d));
    setSelectAllMonth(allSelected);
  }, [currentMonth, selectedDates]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(date);
    }

    setDays(calendarDays);
  };

  const toggleDate = (date) => {
    if (!date) return;
    const dateStr = toLocalDateString(date);
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return selectedDates.includes(toLocalDateString(date));
  };

  const isSunday = (date) => {
    if (!date) return false;
    return date.getDay() === 0;
  };

  const handleToggleSelectAll = (event) => {
    const checked = event.target.checked;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) {
        monthDates.push(toLocalDateString(date));
      }
    }

    if (checked) {
      // Merge current month dates with any existing selections from other months
      const otherDates = selectedDates.filter(d => !monthDates.includes(d));
      setSelectedDates([...otherDates, ...monthDates]);
      setSelectAllMonth(true);
    } else {
      // Clear only current month selections, keep other months
      const remaining = selectedDates.filter(d => !monthDates.includes(d));
      setSelectedDates(remaining);
      setSelectAllMonth(false);
    }
  };

  const handleContinue = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    navigate('/kiosk/payment');
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const perDayTotal = calculatePerDayTotal();
  const grandTotal = perDayTotal * selectedDates.length;

  return (
    <Layout>
      <div className={`min-h-screen p-2 sm:p-2.5 md:p-3 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold">Select Dates</h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
              >
                <FaSignOutAlt /> Logout
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedDates.length === 0}
                className={`flex-1 sm:flex-none px-3 sm:px-3.5 py-1.5 sm:py-2 text-sm font-semibold rounded-lg hover:translate-y-[-1px] transition-colors ${
                  isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue ({selectedDates.length} days)
              </button>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg shadow-black/10 p-2.5 sm:p-3 border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 ">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <button
                  onClick={previousMonth}
                  className={`text-sm sm:text-base font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  ‹
                </button>
                <h2 className="text-sm sm:text-base font-semibold tracking-tight">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button
                  onClick={nextMonth}
                  className={`text-sm sm:text-base font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  ›
                </button>
              </div>
              <label className={`flex items-center gap-2 text-[8px] sm:text-xs ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={selectAllMonth}
                  onChange={handleToggleSelectAll}
                  className="!min-h-0 !min-w-0 w-7 h-7 appearance-none border border-gray-300 rounded checked:bg-amber-400 cursor-pointer"
                />
                <span>Select all (except Sundays)</span>
              </label>
            </div>

            <div className="grid grid-cols-7 gap-y-1 sm:gap-y-1.5">
              {dayNames.map((day) => (
                <div key={day} className={`mr-5 text-center font-semibold py-[3px] text-[11px] sm:text-[12px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-17 w-17"></div>;
                }

                const dateStr = toLocalDateString(date);
                const selected = isDateSelected(date);
                const sunday = isSunday(date);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !sunday && toggleDate(date)}
                    disabled={sunday}
                    className={`h-17 w-17 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all ${
                      sunday
                        ? isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selected
                        ? isDark ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30' : 'bg-blue-600 text-white shadow-md'
                        : isDark ? 'bg-slate-900 text-slate-100 hover:bg-slate-800' : 'bg-gray-50 text-gray-700 hover:bg-blue-100'
                    }`}
                    style={{ boxShadow: !sunday && !selected ? '0 1px 4px rgba(0,0,0,0.08)' : undefined }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-3 sm:p-3.5 border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-[13px] sm:text-sm">
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Per Day Total</div>
                <div className={`text-lg font-bold ${isDark ? 'text-amber-300' : 'text-blue-600'}`}>₹{perDayTotal.toFixed(2)}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Selected Days</div>
                <div className="text-lg font-bold">{selectedDates.length}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Grand Total</div>
                <div className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-green-600'}`}>₹{grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarSelection;

