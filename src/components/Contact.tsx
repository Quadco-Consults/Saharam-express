'use client'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'

const contactInfo = [
  {
    icon: Phone,
    title: 'Call Us',
    details: [
      { label: 'Customer Service', value: '+234 701 234 5678' },
      { label: 'Booking Support', value: '+234 802 345 6789' }
    ]
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: [
      { label: 'General Inquiries', value: 'info@saharanexpress.com.ng' },
      { label: 'Support', value: 'support@saharanexpress.com.ng' }
    ]
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: [
      { label: 'Mon - Sat', value: '5:00 AM - 10:00 PM' },
      { label: 'Sunday', value: '6:00 AM - 9:00 PM' }
    ]
  }
]

const offices = [
  {
    city: 'Kano Office',
    address: 'Sabon Gari Transport Terminal',
    area: 'Sabon Gari, Kano State',
    phone: '+234 701 234 5678',
    email: 'kano@saharanexpress.com.ng'
  },
  {
    city: 'Kaduna Office',
    address: 'Central Transport Terminal',
    area: 'Kaduna South, Kaduna State',
    phone: '+234 802 345 6789',
    email: 'kaduna@saharanexpress.com.ng'
  }
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', formData)
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Contact Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Get in Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about our services? Need help with your booking?
            Our friendly customer service team is here to assist you 24/7.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => {
            const IconComponent = info.icon
            return (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="bg-saharan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="w-8 h-8 text-saharan-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{info.title}</h3>
                <div className="space-y-2">
                  {info.details.map((detail, detailIndex) => (
                    <div key={detailIndex}>
                      <p className="text-sm text-gray-600">{detail.label}</p>
                      <p className="font-medium text-gray-800">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Office Locations & Contact Form */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Office Locations */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-8">Our Offices</h3>
            <div className="space-y-6">
              {offices.map((office, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-saharan-100 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-saharan-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{office.city}</h4>
                      <p className="text-gray-600 mb-1">{office.address}</p>
                      <p className="text-gray-600 mb-3">{office.area}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-saharan-500" />
                          <span className="text-sm text-gray-700">{office.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-saharan-500" />
                          <span className="text-sm text-gray-700">{office.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-8">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="booking">Booking Inquiry</option>
                  <option value="support">Customer Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-saharan-500 text-white py-3 rounded-lg hover:bg-saharan-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Additional Support */}
        <div className="mt-16 text-center">
          <div className="bg-saharan-50 rounded-xl p-8 border border-saharan-100">
            <MessageCircle className="w-12 h-12 text-saharan-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Need Immediate Help?</h3>
            <p className="text-gray-600 mb-6">
              For urgent matters or immediate assistance, call our 24/7 hotline
            </p>
            <a
              href="tel:+2347012345678"
              className="inline-flex items-center gap-2 bg-saharan-500 text-white px-6 py-3 rounded-lg hover:bg-saharan-600 transition-colors font-medium"
            >
              <Phone className="w-5 h-5" />
              Call Now: +234 701 234 5678
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}