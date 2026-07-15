
import React, { useState } from 'react';
import { Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-4">
      <div className="grid lg:grid-cols-2 gap-16">
        <div>
          <h1 className="text-4xl font-black text-[#002366] mb-6">Get in Touch</h1>
          <p className="text-gray-600 text-lg mb-10">
            Have questions about EduTools? We're here to help you optimize your career path and academic life.
          </p>

          <div className="space-y-8">
            <p className="text-[#002366] font-bold">
              Reach out to us via the contact form and we'll reply to you within 24 hours.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100">
          {submitted ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Message Sent!</h2>
              <p className="text-gray-600 mt-2">We'll get back to you as soon as possible.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-8 text-blue-600 font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="How can we help?" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                <textarea className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="Tell us more about your inquiry..." required />
              </div>
              <button type="submit" className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-blue-800 shadow-lg transition-all active:scale-95">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
