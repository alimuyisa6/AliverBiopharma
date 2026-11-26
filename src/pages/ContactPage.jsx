/* pages/ContactPage.jsx */
import { useState, useCallback } from 'react';
import { submitContact } from '../api/cachedClient';
import { ContactSection } from '../features/contact/ContactSection';

const initialContactForm = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [contactStatus, setContactStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = useCallback(async (event) => {
    event.preventDefault();

    const payload = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      subject: contactForm.subject,
      message: contactForm.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setContactStatus({ success: false, message: 'Please complete all required fields.' });
      return;
    }

    setSubmitting(true);
    setContactStatus(null);

    try {
      await submitContact(payload);
      setContactStatus({ success: true, message: 'Your message has been sent. Thank you for contacting us.' });
      setContactForm(initialContactForm);
    } catch {
      setContactStatus({ success: false, message: 'We could not send your message right now. Please try again shortly.' });
    } finally {
      setSubmitting(false);
    }
  }, [contactForm]);

  return (
    <main className="w-full bg-primary-50">
      <section className="relative isolate overflow-hidden bg-primary-900 bg-cover bg-[center_40%] text-white max-md:bg-[60%_center] bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d')] px-5 py-16 sm:py-24">
        <div className="absolute inset-0 bg-primary-900/90" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">Contact AliverBiopharm</h1>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-white/85 sm:mt-14">Need help with your account, study materials, or a website feature? Send our team a message and we will review your inquiry.</p>
        </div>
      </section>

      <section className="w-full bg-secondary-50 px-5 py-12 sm:py-16">
        <ContactSection
          contactForm={contactForm}
          contactStatus={contactStatus}
          onChange={setContactForm}
          onSubmit={handleContactSubmit}
          submitting={submitting}
        />
      </section>
    </main>
  );
}
