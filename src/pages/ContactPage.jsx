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
    <main className="contact-page w-full bg-[#EAF2FA]">
      <section className="ab-page-hero ab-contact-hero relative isolate overflow-hidden px-5 py-16 sm:py-24">
        <div className="ab-page-hero-overlay absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">Contact AliverBiopharm</h1>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-white/85 sm:mt-14">Need help with your account, study materials, or a website feature? Send our team a message and we will review your inquiry.</p>
          <img
            src="/illustrations/contact.svg"
            alt="Illustration of a support conversation"
            className="mt-12 h-auto w-full max-w-[420px] object-contain sm:mt-16"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="px-5 py-12 sm:py-16" style={{ backgroundColor: '#F1EDFA' }}>
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
