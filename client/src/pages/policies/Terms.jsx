import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-semibold text-amber-300">{title}</h2>
    <div className="text-sm sm:text-base leading-relaxed text-slate-200">{children}</div>
  </section>
);

const Terms = () => {
  const { isDark } = useTheme();

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-100'} pb-16`}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          <div className="absolute inset-0 max-w-3xl bg-gradient-to-br from-amber-400/10 via-indigo-500/10 to-sky-500/10 blur-3xl pointer-events-none" />
          <div className={`relative rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-gray-200 bg-white'} shadow-2xl shadow-amber-500/10 p-6 sm:p-10 space-y-8`}>
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Policy</p>
                  <h1 className="text-3xl sm:text-4xl font-bold">Terms &amp; Conditions</h1>
                </div>
                <div className="text-xs sm:text-sm px-3 py-2 rounded-full border border-amber-300/40 text-amber-200 bg-amber-500/10">
                  Last updated on Dec 8, 2025
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
                These terms govern your use of our canteen ordering app for tea, coffee, and light snacks.
                By browsing or placing an order, you agree to the terms below.
              </p>
            </header>

            <div className="grid gap-6">
              <Section title="Who we are">
                The service is operated by PRITHVI INNER WEARS PRIVATE LIMITED from 5/178 D Mangalam Road,
                Sultanpettai Mangalam, Vamjipalayam, Tirupur, Coimbatore, Tamil Nadu 641603. References to
                “we”, “us”, or “our” refer to this operator. References to “you” or “your” refer to anyone
                using the app or placing an order.
              </Section>

              <Section title="Using the app">
                <ul className="list-disc list-inside space-y-2">
                  <li>Content, menus, prices, and timings may change without notice.</li>
                  <li>Allergens: beverages may contain milk, sugar, and flavorings; ask if unsure before ordering.</li>
                  <li>You are responsible for ensuring the order meets your needs and dietary preferences.</li>
                  <li>Unauthorized use, tampering, or misuse of the app is prohibited.</li>
                </ul>
              </Section>

              <Section title="Orders &amp; payment">
                <ul className="list-disc list-inside space-y-2">
                  <li>Orders are prepared shortly after confirmation; preparation starts once payment succeeds.</li>
                  <li>Payment must be completed in the app using the available methods.</li>
                  <li>Once preparation has started, orders generally cannot be modified.</li>
                </ul>
              </Section>

              <Section title="Pickup &amp; delivery">
                <ul className="list-disc list-inside space-y-2">
                  <li>Pickup is at the designated canteen counter during operating hours.</li>
                  <li>If on-premise delivery is offered, it is limited to the specified campus/office area and subject to staff availability.</li>
                  <li>We are not liable for delays caused by events outside our control.</li>
                </ul>
              </Section>

              <Section title="Cancellations &amp; refunds">
                Because beverages are prepared fresh, cancellation is only possible until preparation begins.
                Approved refunds will be issued to the original payment method per our Cancellation &amp; Refund Policy.
              </Section>

              <Section title="Intellectual property">
                All branding, design, and content in the app are owned or licensed by us. Do not reproduce or reuse without written consent.
              </Section>

              <Section title="Liability">
                To the fullest extent permitted by law, we disclaim warranties regarding accuracy, availability, or
                fitness for a particular purpose. Our liability is limited to the amount you paid for the affected order.
              </Section>

              <Section title="Disputes &amp; contact">
                These terms are governed by the laws of India. For questions or concerns, contact us at 8056672405 or
                customercare@prithvimail.com.
              </Section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/policies/privacy"
                className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/30 hover:translate-y-[-1px] transition-transform"
              >
                View Privacy Policy
              </Link>
              <Link
                to="/policies/refund"
                className={`px-4 py-3 rounded-xl border ${isDark ? 'border-slate-700 text-slate-200 hover:border-amber-300' : 'border-gray-300 text-gray-800 hover:border-gray-500'} transition-all`}
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

export default Terms;

