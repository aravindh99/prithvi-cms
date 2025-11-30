import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Layout from '../../components/Layout.jsx';
import { FaSignOutAlt } from 'react-icons/fa';

const CalendarSelection = () => {
  const { selectedDates, setSelectedDates, selectedProducts, calculatePerDayTotal } = useOrder();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState([]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  useEffect(() => {
    // Auto-select all days except Sundays on initial load
    if (selectedDates.length === 0) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const autoSelected = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() !== 0) { // Not Sunday
          autoSelected.push(date.toISOString().split('T')[0]);
        }
      }

      setSelectedDates(autoSelected);
    }
  }, []);

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
    const dateStr = date.toISOString().split('T')[0];
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return selectedDates.includes(date.toISOString().split('T')[0]);
  };

  const isSunday = (date) => {
    if (!date) return false;
    return date.getDay() === 0;
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
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Select Dates</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <FaSignOutAlt /> Logout
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedDates.length === 0}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue ({selectedDates.length} days)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <button
                onClick={previousMonth}
                className="text-lg sm:text-xl font-bold text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1"
              >
                ‹
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="text-lg sm:text-xl font-bold text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-1 text-sm">
                  {day}
                </div>
              ))}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }

                const dateStr = date.toISOString().split('T')[0];
                const selected = isDateSelected(date);
                const sunday = isSunday(date);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !sunday && toggleDate(date)}
                    disabled={sunday}
                    className={`aspect-square rounded-lg text-base font-semibold transition-all ${
                      sunday
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-600 text-xs sm:text-sm mb-1">Per Day Total</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">₹{perDayTotal.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs sm:text-sm mb-1">Selected Days</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{selectedDates.length}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs sm:text-sm mb-1">Grand Total</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarSelection;

