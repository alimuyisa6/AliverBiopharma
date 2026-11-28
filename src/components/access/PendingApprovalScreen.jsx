 /* components/access/PendingApprovalScreen.jsx */
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';

export function PendingApprovalScreen() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <Icon name="clock" className="mb-4 h-10 w-10 text-amber-600" />
          <h2 className="text-xl font-bold leading-7 text-slate-900 sm:text-2xl">
            Teacher Account<br />Pending Approval
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Your teacher application is being reviewed by an administrator.
            You'll be notified via email once your account is approved.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Under Review
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
            <Icon name="envelope" />
            <span>Questions? Contact us at</span>
            <a href="mailto:support@aliverbiopharm.com">support@aliverbiopharm.com</a>
          </div>

          <Link to="/" className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
            <Icon name="arrow-left" />
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
