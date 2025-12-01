import nodemailer from 'nodemailer'

// Create email transporter based on environment configuration
export async function createTransporter(): Promise<nodemailer.Transporter | null> {
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD

    // Check if SMTP configuration is available
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('Email service not configured - missing SMTP settings')
      return null
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      tls: {
        rejectUnauthorized: false // For development/self-signed certificates
      }
    })

    // Verify connection
    await transporter.verify()
    console.log('Email transporter configured successfully')

    return transporter

  } catch (error) {
    console.error('Email configuration error:', error)
    return null
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = await createTransporter()
    return transporter !== null
  } catch (error) {
    console.error('Email test failed:', error)
    return false
  }
}