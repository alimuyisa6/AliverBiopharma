/* features/contact/ContactSection.jsx */
import Input from '../../components/Input/Input';
import Textarea from '../../components/Textarea/Textarea';
import Button from '../../components/Button/Button';

const contactReasons = ['Account Support', 'Subscription', 'Donations'];

const contactFaqs = [
  {
    question: 'What information should I include in my message?',
    answer: 'Describe what happened, what you were trying to do, and any relevant page or feature. Please do not include passwords, payment card details, or other sensitive information.',
  },
  {
    question: 'Where will your team reply?',
    answer: 'We will use the email address you enter in this form. Please check that it is correct and keep an eye on your inbox and spam folder.',
  },
  {
    question: 'Can I use this form to report a technical problem?',
    answer: 'Yes. Choose Account Support and explain the problem, including the page or feature where you noticed it and the steps that led to it.',
  },
  {
    question: 'What if I have already sent a message?',
    answer: 'Please allow our team time to review your request. If you need to add information, include the same email address and explain that it is a follow-up to your earlier message.',
  },
];

export function ContactSection({
  contactForm,
  contactStatus,
  onChange,
  onSubmit,
  submitting = false
}) {
  const updateField = (field, value) => {
    onChange({ ...contactForm, [field]: value });
  };

  return (
    <section className="contact-section mx-auto w-full max-w-6xl">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <form className="space-y-6" onSubmit={onSubmit}>
            <Input
              label="Full Name"
              value={contactForm.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              maxLength={120}
              icon="user"
            />

            <Input
              label="Email Address"
              type="email"
              value={contactForm.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              maxLength={320}
              icon="envelope"
            />

            <fieldset>
              <legend className="mb-3 text-base font-bold text-slate-900">Select a reason for contacting us <span aria-hidden="true" className="text-red-600">*</span></legend>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Contact reason">
                {contactReasons.map((reason) => {
                  const selected = contactForm.subject === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateField('subject', reason)}
                      className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-2.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${selected ? 'border-primary-700 bg-primary-700 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-800 hover:border-primary-600 hover:bg-primary-50'}`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Textarea
              label="Tell us more"
              value={contactForm.message}
              onChange={(event) => updateField('message', event.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="Please provide a few details about your inquiry so we can assist you."
              required
            />
            <p className="text-right text-sm text-slate-500">{contactForm.message.length}/3000</p>

            <Button
              type="submit"
              icon="paper-plane"
              loading={submitting}
              loadingLabel="Sending…"
              disabled={submitting || !contactForm.subject || !contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()}
            >
              Send Message
            </Button>

            {contactStatus && (
              <p className={`rounded-xl px-4 py-3 text-sm font-medium ${contactStatus.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`} role="status" aria-live="polite">
                {contactStatus.message}
              </p>
            )}

            <p className="mt-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-center font-serif text-base italic leading-7 text-primary-900">
              Note: You can only send two messages per day.
            </p>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Before you send</h2>
            <p className="mt-3 leading-7 text-slate-600">A little detail helps us understand your request. Include the page or feature involved and what you expected to happen. Never send passwords or payment details.</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Contact form help</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {contactFaqs.map((item) => (
                <details key={item.question} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.question}
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-700 text-3xl font-medium leading-none text-white shadow-md transition-transform group-open:rotate-45 group-open:bg-primary-800" aria-hidden="true">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-extrabold tracking-tight text-white">What happens next?</h2>
            <p className="mt-3 leading-7 text-white">Your message will be sent to our support team for review. We will follow up using the email address you provided.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
