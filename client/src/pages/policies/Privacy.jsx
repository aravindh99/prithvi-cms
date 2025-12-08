import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-semibold text-emerald-300">{title}</h2>
    <div className="text-sm sm:text-base leading-relaxed text-slate-200">{children}</div>
  </section>
);

const Privacy = () => {
  const { isDark } = useTheme();

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-100'} pb-16`}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          <div className="absolute inset-0 max-w-3xl bg-gradient-to-br from-emerald-400/10 via-cyan-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
          <div className={`relative rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-gray-200 bg-white'} shadow-2xl shadow-emerald-500/10 p-6 sm:p-10 space-y-8`}>
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Policy</p>
                  <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
                </div>
                <div className="text-xs sm:text-sm px-3 py-2 rounded-full border border-emerald-300/40 text-emerald-200 bg-emerald-500/10">
                  Last updated on Dec 8, 2025
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
                This policy explains how we collect, use, and safeguard information when you use our canteen ordering app
                for tea, coffee, and related items.
              </p>
            </header>

            <div className="grid gap-6">
              <Section title="Information we collect">
                <ul className="list-disc list-inside space-y-2">
                  <li>Account details: name, phone, email, and organization (if applicable).</li>
                  <li>Order details: items, preferences (e.g., sugar/milk choices), and transaction IDs.</li>
                  <li>Usage data: device info, browser type, IP, and interaction logs for troubleshooting and improvements.</li>
                  <li>Support interactions: messages and feedback shared with us.</li>
                </ul>
              </Section>

              <Section title="How we use data">
                <ul className="list-disc list-inside space-y-2">
                  <li>Process and fulfill orders, including payment confirmation and pickup/delivery updates.</li>
                  <li>Improve menu, service speed, and app reliability.</li>
                  <li>Send service-related notifications; occasional offers are sent only with your consent.</li>
                  <li>Detect and prevent fraud or misuse.</li>
                </ul>
              </Section>

              <Section title="Sharing">
                We do not sell your data. We share only with essential service providers (e.g., payment processors,
                analytics tools) under confidentiality obligations, or when required by law.
              </Section>

              <Section title="Cookies &amp; tracking">
                We use cookies or similar technologies to keep you signed in, remember preferences, and measure usage.
                You can adjust browser settings to limit cookies, but some features may not work as expected.
              </Section>

              <Section title="Data retention">
                We retain order and account records for operational, accounting, and legal requirements. When data is no
                longer needed, we delete or anonymize it where feasible.
              </Section>

              <Section title="Security">
                We use reasonable technical and organizational measures to protect information. No system is fully secure,
                so please use strong passwords and keep your device protected.
              </Section>

              <Section title="Your choices">
                <ul className="list-disc list-inside space-y-2">
                  <li>Update or correct your profile information within the app or by contacting support.</li>
                  <li>Opt out of promotional messages via provided unsubscribe options.</li>
                  <li>Request deletion of your account; some records may be retained as required by law.</li>
                </ul>
              </Section>

              <Section title="Contact">
                For privacy questions or requests, reach us at customercare@prithvimail.com or 8056672405, or write to
                5/178 D Mangalam Road, Sultanpettai Mangalam, Vamjipalayam, Tirupur, Coimbatore, Tamil Nadu 641603.
              </Section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/policies/terms"
                className="px-4 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px] transition-transform"
              >
                Back to Terms
              </Link>
              <Link
                to="/policies/refund"
                className={`px-4 py-3 rounded-xl border ${isDark ? 'border-slate-700 text-slate-200 hover:border-emerald-300' : 'border-gray-300 text-gray-800 hover:border-gray-500'} transition-all`}
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

export default Privacy;

