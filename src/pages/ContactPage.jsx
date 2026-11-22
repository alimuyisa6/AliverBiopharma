 /* pages/ContactPage.jsx */
import { useState, useEffect, useCallback } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import { submitContact } from '../api/cachedClient';
import { ContactSection } from '../features/contact/ContactSection';
import StorysetIllustration from '../components/StorysetIllustration';

export default function ContactPage() {
  const { level } = useLayout();
  const [sections, setSections] = useState({});
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (level?.id) {
      getSections(level.id).then(setSections).catch(() => {});
    }
  }, [level]);

  const handleContactSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) return;

    setSubmitting(true);
    try {
      await submitContact(contactForm);
      setContactStatus({ success: true, message: 'Your message has been sent.' });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setContactStatus({ success: false, message: error.message });
    } finally {
      setSubmitting(false);
    }
  }, [contactForm]);

  return (
    <main className="contact-page w-full" style={{ backgroundColor: '#EAF2FA' }}>
      <section className="ab-page-hero ab-contact-hero relative isolate overflow-hidden px-5 py-16 sm:py-24">
        <div className="ab-page-hero-overlay absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <h1 className="max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">Contact AliverBiopharm</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">Need help with your account, study materials, or a website feature? Send our team a message.</p>
          </div>
          <StorysetIllustration name="goodTeam" alt="Support team ready to help learners" className="mx-auto w-full max-w-[240px] object-contain" />
        </div>
      </section>
      <div className="px-5 py-12 sm:py-16" style={{ backgroundColor: '#F1EDFA' }}>
        <ContactSection
          contactForm={contactForm}
          contactStatus={contactStatus}
          contactInfo={sections?.contact?.info || []}
          onChange={setContactForm}
          onSubmit={handleContactSubmit}
          submitting={submitting}
        />
      </div>
    </main>
  );
}
