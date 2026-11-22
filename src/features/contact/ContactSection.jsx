/* features/contact/ContactSection.jsx */
import Input from '../../components/Input/Input';
import Textarea from '../../components/Textarea/Textarea';
import Button from '../../components/Button/Button';

const contactReasons = ['Account issue', 'Subscription', 'Donations'];

export function ContactSection({
  contactForm,
  contactStatus,
  onChange,
  onSubmit,
  submitting = false
}) {
  return (
    <section className="contact-section reveal">
      <div className="contact-form-wrap">
        <form className="contact-form" onSubmit={onSubmit}>
          <div className="card card-blue card-surface-solid card-tone-info card-elevation-soft form-card">
            <Input
              label="Full Name"
              value={contactForm.name}
              onChange={(event) => onChange({ ...contactForm, name: event.target.value })}
              required
              icon="user"
            />

            <Input
              label="Email Address"
              type="email"
              value={contactForm.email}
              onChange={(event) => onChange({ ...contactForm, email: event.target.value })}
              required
              icon="envelope"
            />

            <fieldset className="mt-6">
              <legend className="mb-3 text-base font-bold text-slate-900">Select a reason for contacting us</legend>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Contact reason">
                {contactReasons.map((reason) => {
                  const selected = contactForm.subject === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange({ ...contactForm, subject: reason })}
                      className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-2.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${selected ? 'border-primary-700 bg-primary-700 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-800 hover:border-primary-600 hover:bg-primary-50'}`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Textarea
              label="Please describe your issue"
              value={contactForm.message}
              onChange={(event) => onChange({ ...contactForm, message: event.target.value })}
              rows={4}
              placeholder="Please provide a few details so we can better assist you."
              required
            />

            <Button
              type="submit"
              icon="paper-plane"
              loading={submitting}
              loadingLabel="Sending…"
              disabled={!contactForm.subject}
            >
              Send Message
            </Button>

            {contactStatus && (
              <p className={`form-status ${contactStatus.success ? 'success' : 'error'}`} role="status">
                {contactStatus.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
