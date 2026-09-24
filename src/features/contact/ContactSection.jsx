/* features/contact/ContactSection.jsx */
import Icon from '../../components/Icon/Icon';
import Input from '../../components/Input/Input';
import Textarea from '../../components/Textarea/Textarea';
import Button from '../../components/Button/Button';

export function ContactSection({ contactForm, contactStatus, contactInfo = [], onChange, onSubmit, submitting = false }) {
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
            <Input
              label="Subject"
              value={contactForm.subject}
              onChange={(event) => onChange({ ...contactForm, subject: event.target.value })}
              required
            />
            <Textarea
              label="Message"
              value={contactForm.message}
              onChange={(event) => onChange({ ...contactForm, message: event.target.value })}
              rows={4}
              required
            />

            <Button type="submit" icon="paper-plane" loading={submitting} loadingLabel="Sending…">Send Message</Button>

            {contactStatus && (
              <p className={`form-status ${contactStatus.success ? 'success' : 'error'}`}>
                {contactStatus.message}
              </p>
            )}
          </div>
        </form>

value}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
