"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Check,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ArrowLeft,
} from "lucide-react";
import { useIsDarkMode } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ContactPage() {
  const isDarkMode = useIsDarkMode();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+251 (915) 574522", "+251 (923) 993000"],
      action: "Call Me",
      link: "tel:+251 (915) 574522",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["haftish4516@gmail.com"],
      action: "Email Me",
      link: "haftamu:haftish4516@gmail.com",
    },
    {
      icon: MapPin,
      title: "Office",
      details: ["Gurd shola", "Addis Ababa,"],
      action: "Get directions",
      link: "https://www.google.com/maps/place/Gurd+Shola,+Addis+Ababa/data=!4m2!3m1!1s0x164b854d8b4952a9:0x58c72842aca616fa?sa=X&ved=1t:242&ictx=111",
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 9AM - 6PM",
        "Saturday: 10AM - 4PM",
        "Sunday: Closed",
      ],
      action: "View hours",
      link: "#",
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://web.facebook.com/haftamudesta/",
      label: "Facebook",
    },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/haftamudesta/",
      label: "LinkedIn",
    },
  ];

  const theme = {
    bg: {
      primary: isDarkMode ? "var(--color-gray-800)" : "white",
      secondary: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-50)",
      card: isDarkMode ? "var(--color-gray-800)" : "white",
      hover: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-100)",
    },
    text: {
      primary: isDarkMode ? "white" : "var(--color-gray-900)",
      secondary: isDarkMode ? "var(--color-gray-400)" : "var(--color-gray-600)",
      muted: isDarkMode ? "var(--color-gray-500)" : "var(--color-gray-400)",
    },
    border: {
      default: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-200)",
      input: isDarkMode ? "var(--color-gray-600)" : "var(--color-gray-300)",
    },
  };

  return (
    <div className="container-custom py-12 bg-[#191970]">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="p-2 rounded-lg transition-colors"
          style={{
            color: theme.text.secondary,
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bg.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: theme.text.primary }}
        >
          Contact Me
        </h1>
      </div>

      <div className="bg-[#ffffff1a] relative rounded-2xl overflow-hidden mb-12 p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          I am Here to Help you
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          Have a question, feedback, or just want to say hello? I would love to
          hear from you!
        </p>
      </div>
      <div className="bg-[#ffffff1a] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 ">
        {contactInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <div className="bg-[#ffffff1a] text-white" key={index}>
              <Card
                key={index}
                className="border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                  <div className="space-y-1 mb-4">
                    {info.details.map((detail, i) => (
                      <p key={i} className="text-sm">
                        {detail}
                      </p>
                    ))}
                  </div>
                  <a
                    href={info.link}
                    className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    {info.action} →
                  </a>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <Card className="border bg-[#ffffff1a] text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Send Me a Message</h2>

            {isSubmitted && (
              <div className="mb-6 p-4 rounded-lg flex items-center gap-3">
                <Check className="w-5 h-5" />
                <p style={{ color: "var(--color-success)" }}>
                  Thank you for your message! I'll get back to you soon.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle
                  className="w-5 h-5"
                  style={{ color: "var(--color-error)" }}
                />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                  >
                    Name <span>*</span>
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Haftamu Desta"
                    required
                    className="focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                  >
                    Email <span>*</span>
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="haftamud@gmail.com"
                    required
                    className="focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium mb-2"
                >
                  Subject
                </label>
                <Input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  Message <span>*</span>
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows={6}
                  required
                  className="focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    Send Message
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#ffffff1a] text-white border overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Visit the Store</h2>

            <div className="aspect-video rounded-lg mb-6 overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15761.958351994042!2d38.817208099999995!3d9.01902355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b854d8b4952a9%3A0x58c72842aca616fa!2sGurd%20Shola%2C%20Addis%20Ababa!5e0!3m2!1sen!2set!4v1771507560638!5m2!1sen!2set"
                width="600"
                height="450"
                loading="lazy"
              ></iframe>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Flagship Store</p>
                  <p>
                    Gurd shola Street
                    <br />
                    Addis Ababa
                    <br />
                    Ethiopia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Store Hours</p>
                  <p>
                    Monday - Friday: 9AM - 8PM
                    <br />
                    Saturday: 10AM - 6PM
                    <br />
                    Sunday: 12PM - 5PM
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border mb-12 bg-[#ffffff1a] text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "How long does shipping take?",
                a: "Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.",
              },
              {
                q: "What is your return policy?",
                a: "We offer 30-day hassle-free returns on all items. Items must be unused and in original packaging.",
              },
              {
                q: "Do you ship internationally?",
                a: "Yes, we ship to most countries worldwide. Shipping costs and times vary by location.",
              },
              {
                q: "How can I track my order?",
                a: "Once your order ships, you'll receive a tracking number via email to monitor your delivery.",
              },
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <p className="text-center">
            Still have questions?{" "}
            <a href="#" className="font-medium hover:underline">
              Visit our FAQ page
            </a>{" "}
            for more information.
          </p>
        </CardContent>
      </Card>

      <div className="text-center bg-[#ffffff1a] text-white">
        <h2 className="text-2xl font-bold mb-4">Connect With Me</h2>
        <p className="mb-6">
          Follow Me on social media for the latest updates and offers
        </p>

        <div className="flex justify-center gap-4">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-primary-600)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.bg.secondary;
                  e.currentTarget.style.color = theme.text.secondary;
                }}
                aria-label={social.label}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
