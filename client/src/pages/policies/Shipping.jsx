import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-semibold text-sky-300">{title}</h2>
    <div className="text-sm sm:text-base leading-relaxed text-slate-200">{children}</div>
  </section>
);

const Shipping = () => {
  const { isDark } = useTheme();

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-100'} pb-16`}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          <div className="absolute inset-0 max-w-3xl bg-gradient-to-br from-sky-400/15 via-blue-400/10 to-indigo-400/10 blur-3xl pointer-events-none" />
          <div className={`relative rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-gray-200 bg-white'} shadow-2xl shadow-sky-500/10 p-6 sm:p-10 space-y-8`}>
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Policy</p>
                  <h1 className="text-3xl sm:text-4xl font-bold">Delivery &amp; Pickup Policy</h1>
                </div>
                <div className="text-xs sm:text-sm px-3 py-2 rounded-full border border-sky-300/40 text-sky-200 bg-sky-500/10">
                  Last updated on Dec 8, 2025
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
                We primarily serve fresh tea and coffee within the campus/office premises. This policy explains how pickup
                and any on-premise delivery works.
              </p>
            </header>

            <div className="grid gap-6">
              <Section title="Service area">
                Orders are prepared at our canteen and are available for pickup at the designated counter. If delivery is
                offered, it is limited to the approved campus/office area only.
              </Section>

              <Section title="Timelines">
                <ul className="list-disc list-inside space-y-2">
                  <li>Most beverage orders are ready within a few minutes during operating hours.</li>
                  <li>Estimated ready times shown in the app are indicative and can vary with demand.</li>
                  <li>Delays due to factors beyond our control (e.g., equipment issues) will be communicated where possible.</li>
                </ul>
              </Section>

              <Section title="Pickup">
                <ul className="list-disc list-inside space-y-2">
                  <li>Present your order ID or show the app screen at the counter to collect.</li>
                  <li>Please collect promptly to enjoy the beverage at its best temperature and quality.</li>
                </ul>
              </Section>

              <Section title="Delivery (if enabled)">
                <ul className="list-disc list-inside space-y-2">
                  <li>Delivery is subject to staff availability and may pause during peak times.</li>
                  <li>Ensure accurate location instructions; we are not responsible for delays caused by incorrect details.</li>
                  <li>Risk passes to you upon handover at the provided location.</li>
                </ul>
              </Section>

              <Section title="Contact">
                For delivery or pickup questions, contact 8056672405 or customercare@prithvimail.com, or visit us at 5/178 D
                Mangalam Road, Sultanpettai Mangalam, Vamjipalayam, Tirupur, Coimbatore, Tamil Nadu 641603.
              </Section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/policies/terms"
                className="px-4 py-3 rounded-xl bg-sky-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/30 hover:translate-y-[-1px] transition-transform"
              >
                Back to Terms
              </Link>
              <Link
                to="/policies/refund"
                className={`px-4 py-3 rounded-xl border ${isDark ? 'border-slate-700 text-slate-200 hover:border-sky-300' : 'border-gray-300 text-gray-800 hover:border-gray-500'} transition-all`}
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;

