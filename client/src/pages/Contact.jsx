import { useState } from "react";
import { Mail, Send, UserRound } from "lucide-react";
import { API } from "../utils/api";
import { FormField, InfoBanner, PageIntro, PageSection, PageShell, SurfaceCard, TextArea, TextInput } from "../components/ui.jsx";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export const Contact = () => {
  const [formData, setFormData] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (message) {
      setMessage("");
      setMessageTone("info");
    }
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setMessageTone("info");

    try {
      const { data } = await API.post("/contact", formData);

      setMessageTone("success");
      setMessage(data?.message || "Message sent successfully");
      setFormData(initialForm);
    } catch (requestError) {
      setMessageTone("error");
      setMessage(requestError?.response?.data?.message || "Unable to send your message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageSection className="pt-12 sm:pt-16">
        <PageShell className="space-y-10">
          <PageIntro
            kicker="Contact"
            title="Reach the StayFinder team for help, support, or partnerships."
            description="Send us a message through the form and we will store it for follow-up through the backend contact flow."
          />

          <div className="mx-auto w-full max-w-3xl">
            <SurfaceCard className="p-8 sm:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Contact form</p>
                <h2 className="mt-2 panel-title">Tell us how we can help</h2>
                <p className="mt-2 text-sm text-ink-500">Share a few details and send your message directly from the site.</p>
              </div>
              {message ? <InfoBanner tone={messageTone} className="mt-6">{message}</InfoBanner> : null}
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Name">
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                      <TextInput className="pl-11" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                  </FormField>

                  <FormField label="Email">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                      <TextInput className="pl-11" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </FormField>
                </div>

                <FormField label="Subject" hint="Optional">
                  <TextInput name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help?" />
                </FormField>

                <FormField label="Message">
                  <TextArea name="message" rows="6" value={formData.message} onChange={handleChange} required />
                </FormField>

                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={sending}>
                  <Send size={18} />
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </SurfaceCard>
          </div>
        </PageShell>
      </PageSection>
    </>
  );
};
