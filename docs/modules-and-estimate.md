# Prithvi Canteen App — Modules & Estimate

## Admin

- Auth: admin login, session handling, theme awareness.
- Dashboard: revenue/bills summary, filters (date/unit/mode), charts (line/donut), PDF export.
- Products: CRUD with images, unit selection, active toggle.
- Units: CRUD, printer IP/port config, test-print trigger.
- Users: CRUD, roles (admin/user), unit assignment.
- Checkout (Admin): date picker with select-all (no Sundays), product selection, payment modes (cash/free/guest), bill creation and print trigger.
- Logs: bill filters/search, view/print/retry, delete single/all.

## Kiosk / User

- Auth: kiosk login.
- Product Selection: unit-scoped active products with image fallback.
- Calendar Selection: multi-day picker (no Sundays, select-all), per-day and grand totals.
- Payment: Razorpay UPI flow, order create/verify, cancel on back/dismiss.
- Success: order/payment status, print results, retry note.

## Shared / Infra

- Theming: light/dark via context and toggles.
- Layout: shared shell, footer with policy links.
- API Layer: Axios config (`config/api.js`) with base URL, token handling.
- Assets/Policies: logos, placeholders, Terms/Privacy/Refund/Shipping pages.

## Rough Effort & Pricing (software-only, Tamil Nadu demo context)

- Effort: ~3.5–4.5 person-weeks (1 frontend + part-time backend integration/testing), assuming backend APIs are ready and client-supplied kiosk/printer hardware.
- Build cost (software implementation + basic UAT): ₹2.5L–₹3.5L.
- Ongoing maintenance (optional): ₹25k–₹40k/month for minor tweaks, bugfixes, and support.
- Suggested selling price to customer (one-time software delivery, excl. infra/transaction fees): ₹4L–₹5.5L. Adjust upward if including extended support, custom reports, or deployments.
