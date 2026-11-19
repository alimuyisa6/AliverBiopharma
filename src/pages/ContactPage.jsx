 /* pages/ContactPage.jsx */
import { useState, useEffect, useCallback } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import { submitContact } from '../api/cachedClient';
import { ContactSection } from '../features/contact/ContactSection';

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

    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setSubmitting(true);
    try {
      await submitContact(contactForm);
      setContactStatus({ success: true, message: 'Your message has been sent.' });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setContactStatus({ success: false, message: error.message });
    }
  }, [contactForm]);

  return (
    <div className="contact-page min-h-screen bg-gradient-to-b from-primary-50 via-white to-slate-50 px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="contact-hero mx-auto mb-8 max-w-6xl rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-xl sm:p-10"><h1 className="mb-4 text-white">Contact AliverBiopharm</h1>
      <p className="max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">Need help with your account, study materials, or a website feature? Send our team a message.</p></div>
      <ContactSection
        contactForm={contactForm}
        contactStatus={contactStatus}
        contactInfo={sections?.contact?.info || []}
        onChange={setContactForm}
        onSubmit={handleContactSubmit} submitting={submitting}
      />
    </div>
  );
}