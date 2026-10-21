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
    <div className="section contact-page">
      <h1 className="section-title">Contact AliverBiopharm</h1>
      <p className="section-subtitle">Need help with your account, study materials, or a website feature? Send our team a message.</p>
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
