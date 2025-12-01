'use client'
import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Reply,
  Archive,
  Trash2
} from 'lucide-react'
import { formatDateTime } from '@/utils/formatters'

interface Message {
  id: string
  subject: string
  content: string
  sender_name: string
  sender_email: string
  sender_phone?: string
  type: 'inquiry' | 'complaint' | 'feedback' | 'support'
  status: 'unread' | 'read' | 'replied' | 'archived'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  replied_at?: string
  reply_content?: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showReplyModal, setShowReplyModal] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      // For now, using mock data since we don't have the messages API yet
      // In a real implementation, you would fetch from /api/admin/messages
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setMessages([
        {
          id: '1',
          subject: 'Booking Cancellation Request',
          content: 'Hi, I need to cancel my booking for the Lagos to Abuja trip on December 15th. My booking reference is BK001234. Please process the refund to my account.',
          sender_name: 'John Adebayo',
          sender_email: 'john.adebayo@email.com',
          sender_phone: '+234 801 234 5678',
          type: 'inquiry',
          status: 'unread',
          priority: 'high',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          subject: 'Excellent Service Feedback',
          content: 'I wanted to commend your drivers and staff for the excellent service during my recent trip from Abuja to Kano. The vehicle was comfortable and the driver was professional.',
          sender_name: 'Fatima Hassan',
          sender_email: 'fatima.hassan@email.com',
          type: 'feedback',
          status: 'read',
          priority: 'medium',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          subject: 'Complaint About Late Departure',
          content: 'My trip from Lagos to Port Harcourt departed 2 hours late without any prior notification. This caused me to miss an important meeting. I expect better communication in the future.',
          sender_name: 'Emmanuel Okafor',
          sender_email: 'emmanuel.okafor@email.com',
          sender_phone: '+234 803 567 8901',
          type: 'complaint',
          status: 'replied',
          priority: 'high',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          replied_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          reply_content: 'Dear Mr. Okafor, we sincerely apologize for the delay and inconvenience caused. We have noted your feedback and are working to improve our communication systems.'
        },
        {
          id: '4',
          subject: 'Question About Group Booking Discounts',
          content: 'Hello, I am planning to book tickets for a group of 15 people for a corporate trip. Do you offer any group discounts? What is the process for group bookings?',
          sender_name: 'Sarah Okoro',
          sender_email: 'sarah.okoro@company.com',
          type: 'inquiry',
          status: 'read',
          priority: 'medium',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          subject: 'Technical Issue with Mobile App',
          content: 'I am experiencing difficulties with the mobile app. The payment page keeps crashing when I try to complete my booking. Please assist.',
          sender_name: 'David Eze',
          sender_email: 'david.eze@email.com',
          sender_phone: '+234 805 123 4567',
          type: 'support',
          status: 'unread',
          priority: 'high',
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
        }
      ])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      unread: { color: 'bg-red-100 text-red-700', label: 'Unread', icon: AlertCircle },
      read: { color: 'bg-blue-100 text-blue-700', label: 'Read', icon: MessageCircle },
      replied: { color: 'bg-green-100 text-green-700', label: 'Replied', icon: CheckCircle },
      archived: { color: 'bg-gray-100 text-gray-700', label: 'Archived', icon: Archive }
    }

    const { color, label, icon: Icon } = statusMap[status as keyof typeof statusMap] ||
      { color: 'bg-gray-100 text-gray-700', label: status, icon: AlertCircle }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      inquiry: 'bg-blue-50 text-blue-700 border-blue-200',
      complaint: 'bg-red-50 text-red-700 border-red-200',
      feedback: 'bg-green-50 text-green-700 border-green-200',
      support: 'bg-orange-50 text-orange-700 border-orange-200'
    }

    return (
      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${
        typeMap[type as keyof typeof typeMap] || 'bg-gray-50 text-gray-700 border-gray-200'
      }`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const getPriorityIndicator = (priority: string) => {
    const colorMap = {
      low: 'bg-green-400',
      medium: 'bg-yellow-400',
      high: 'bg-red-400'
    }

    return (
      <div className={`w-3 h-3 rounded-full ${colorMap[priority as keyof typeof colorMap] || 'bg-gray-400'}`} />
    )
  }

  const handleReply = (message: Message) => {
    setSelectedMessage(message)
    setShowReplyModal(true)
  }

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return

    try {
      // In a real implementation, you would send the reply via API
      console.log('Sending reply:', { messageId: selectedMessage.id, content: replyContent })

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === selectedMessage.id
          ? { ...msg, status: 'replied', reply_content: replyContent, replied_at: new Date().toISOString() }
          : msg
      ))

      setShowReplyModal(false)
      setReplyContent('')
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    const matchesType = typeFilter === 'all' || message.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="grid grid-cols-6 gap-4">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages & Communications</h1>
            <p className="text-gray-600 mt-1">Manage customer inquiries, complaints, and feedback</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {messages.filter(m => m.status === 'unread').length} unread
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages, senders, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="inquiry">Inquiries</option>
            <option value="complaint">Complaints</option>
            <option value="feedback">Feedback</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-8">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages found</h3>
            <p className="text-gray-600">
              {messages.length === 0
                ? "No messages have been received yet."
                : "No messages match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div key={message.id} className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                message.status === 'unread' ? 'border-l-4 border-l-saharan-500' : ''
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getPriorityIndicator(message.priority)}
                      <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                      {getStatusBadge(message.status)}
                      {getTypeBadge(message.type)}
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{message.sender_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{message.sender_email}</span>
                      </div>
                      {message.sender_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{message.sender_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(message.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">{message.content}</p>

                    {message.reply_content && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Admin Reply</span>
                          <span className="text-xs text-green-600">
                            {message.replied_at && formatDateTime(message.replied_at)}
                          </span>
                        </div>
                        <p className="text-sm text-green-800">{message.reply_content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {message.status !== 'replied' && (
                      <button
                        onClick={() => handleReply(message)}
                        className="p-2 text-gray-400 hover:text-saharan-600 transition-colors"
                        title="Reply to message"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Reply to Message</h2>
              <p className="text-gray-600 mt-1">Replying to: {selectedMessage.subject}</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Original Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  {selectedMessage.content}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  placeholder="Type your reply here..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={!replyContent.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}