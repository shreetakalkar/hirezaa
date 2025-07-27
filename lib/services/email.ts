// Email service for sending notifications
export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendAssessmentEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  assessmentLink: string,
  expiryDate: Date,
): Promise<void> {
  const template: EmailTemplate = {
    to: candidateEmail,
    subject: `Assessment Invitation - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Congratulations! You've been shortlisted</h2>
        
        <p>Dear ${candidateName},</p>
        
        <p>We're pleased to inform you that you've been shortlisted for the <strong>${jobTitle}</strong> position.</p>
        
        <p>As the next step in our hiring process, we'd like you to complete an online technical assessment.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Assessment Details:</h3>
          <ul>
            <li>The assessment includes multiple choice questions, coding problems, and SQL queries</li>
            <li>You'll have a limited time to complete it once you start</li>
            <li>Please ensure you have a stable internet connection</li>
            <li>The assessment must be completed by ${expiryDate.toLocaleDateString()}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${assessmentLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Assessment
          </a>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Hirezaa Team</p>
      </div>
    `,
    text: `
      Congratulations! You've been shortlisted for the ${jobTitle} position.
      
      Please complete your technical assessment by visiting: ${assessmentLink}
      
      Assessment must be completed by: ${expiryDate.toLocaleDateString()}
      
      Best regards,
      The Hirezaa Team
    `,
  }

  // Mock email sending - replace with actual email service (SendGrid, etc.)
  console.log("Sending assessment email:", template)
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

export async function sendShortlistEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
): Promise<void> {
  const template: EmailTemplate = {
    to: candidateEmail,
    subject: `Congratulations! You've been selected - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Congratulations! You've been selected</h2>
        
        <p>Dear ${candidateName},</p>
        
        <p>We're thrilled to inform you that you've been selected for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!</p>
        
        <p>Your performance in the assessment was outstanding, and we believe you'll be a great addition to our team.</p>
        
        <p>Our HR team will be in touch with you shortly to discuss the next steps, including:</p>
        <ul>
          <li>Offer details and compensation</li>
          <li>Start date and onboarding process</li>
          <li>Required documentation</li>
        </ul>
        
        <p>Once again, congratulations on this achievement!</p>
        
        <p>Best regards,<br>The Hirezaa Team</p>
      </div>
    `,
    text: `
      Congratulations! You've been selected for the ${jobTitle} position at ${companyName}!
      
      Our HR team will be in touch with you shortly to discuss the next steps.
      
      Best regards,
      The Hirezaa Team
    `,
  }

  console.log("Sending shortlist email:", template)
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

export async function sendRejectionEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
): Promise<void> {
  const template: EmailTemplate = {
    to: candidateEmail,
    subject: `Update on your application - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #374151;">Thank you for your interest</h2>
        
        <p>Dear ${candidateName},</p>
        
        <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        
        <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
        
        <p>We were impressed by your qualifications and encourage you to apply for future opportunities that match your skills and experience.</p>
        
        <p>We wish you the best of luck in your job search.</p>
        
        <p>Best regards,<br>The Hirezaa Team</p>
      </div>
    `,
    text: `
      Thank you for your interest in the ${jobTitle} position at ${companyName}.
      
      After careful consideration, we have decided to move forward with other candidates.
      
      We encourage you to apply for future opportunities that match your skills and experience.
      
      Best regards,
      The Hirezaa Team
    `,
  }

  console.log("Sending rejection email:", template)
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
