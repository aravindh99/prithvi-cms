import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-semibold text-orange-300">{title}</h2>
    <div className="text-sm sm:text-base leading-relaxed text-slate-200">{children}</div>
  </section>
);

const Refund = () => {
  const { isDark } = useTheme();

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-100'} pb-16`}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          <div className="absolute inset-0 max-w-3xl bg-gradient-to-br from-orange-400/15 via-amber-400/10 to-pink-400/10 blur-3xl pointer-events-none" />
          <div className={`relative rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-gray-200 bg-white'} shadow-2xl shadow-orange-500/10 p-6 sm:p-10 space-y-8`}>
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-400">Policy</p>
                  <h1 className="text-3xl sm:text-4xl font-bold">Cancellation &amp; Refund Policy</h1>
                </div>
                <div className="text-xs sm:text-sm px-3 py-2 rounded-full border border-orange-300/40 text-orange-200 bg-orange-500/10">
                  Last updated on Dec 8, 2025
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
                Our beverages are made fresh. This policy explains when cancellations or refunds are possible.
              </p>
            </header>

            <div className="grid gap-6">
              <Section title="Before preparation starts">
                You may cancel an order before preparation begins. If cancellation is accepted, we will reverse the
                charge to your original payment method.
              </Section>

              <Section title="After preparation starts">
                Once brewing or preparation starts, cancellation is generally not possible due to the perishable nature of
                tea and coffee.
              </Section>

              <Section title="Quality issues">
                If you receive an incorrect item or find a quality issue, please report it to the counter team or contact
                us at 8056672405 or customercare@prithvimail.com within the same day. If verified, we can replace the item
                or issue a refund at our discretion.
              </Section>

              <Section title="Refund timelines">
                Approved refunds are initiated within 1-2 business days. The time for the amount to reflect depends on your
                bank or payment provider.
              </Section>

              <Section title="Contact">
                For any refund or cancellation queries, reach us at 8056672405 or customercare@prithvimail.com, or visit
                us at 5/178 D Mangalam Road, Sultanpettai Mangalam, Vamjipalayam, Tirupur, Coimbatore, Tamil Nadu 641603.
              </Section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/policies/shipping"
                className="px-4 py-3 rounded-xl bg-orange-400 text-slate-950 font-semibold shadow-lg shadow-orange-500/30 hover:translate-y-[-1px] transition-transform"
              >
                Delivery &amp; Pickup
              </Link>
              <Link
                to="/policies/terms"
                className={`px-4 py-3 rounded-xl border ${isDark ? 'border-slate-700 text-slate-200 hover:border-orange-300' : 'border-gray-300 text-gray-800 hover:border-gray-500'} transition-all`}
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Refund;

