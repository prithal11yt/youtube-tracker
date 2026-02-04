/**
 * Email Service
 * Sends formatted email reports using Gmail SMTP
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor(config) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.appPassword
      }
    });
    this.fromEmail = config.user;
    this.toEmail = config.toEmail;
  }

  /**
   * Format view count for display
   */
  formatViews(views) {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  /**
   * Get status badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      viral: { bg: '#ef4444', text: '🚀 VIRAL', color: '#fff' },
      trending: { bg: '#f97316', text: '🔥 TRENDING', color: '#fff' },
      rising: { bg: '#22c55e', text: '📈 RISING', color: '#fff' }
    };

    const badge = badges[status.level] || badges.rising;
    return `<span style="background: ${badge.bg}; color: ${badge.color}; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${badge.text}</span>`;
  }

  /**
   * Generate HTML email content for keyword-based search
   * @param {Object} data - Analysis data
   * @param {Date} reportDate - Date of the report
   * @returns {string} HTML email content
   */
  generateEmailHTML(data, reportDate) {
    const { viral, trending, rising, keywordsSearched, totalVideosFound, creditsUsed } = data;
    const totalOutperformers = viral.length + trending.length + rising.length;

    const dateStr = reportDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; color: #ffffff;">
  <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; margin-bottom: 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">🔥 AI Niche Outperformers</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">${dateStr}</p>
    </div>

    <!-- Stats Summary -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #333;">
        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${viral.length}</div>
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">🚀 Viral</div>
      </div>
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #333;">
        <div style="font-size: 24px; font-weight: 700; color: #f97316;">${trending.length}</div>
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">🔥 Trending</div>
      </div>
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #333;">
        <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${rising.length}</div>
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">📈 Rising</div>
      </div>
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #333;">
        <div style="font-size: 24px; font-weight: 700; color: #a855f7;">${keywordsSearched}</div>
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">🔍 Keywords</div>
      </div>
    </div>
`;

    // Viral Videos Section
    if (viral.length > 0) {
      html += this.generateVideoSection(viral, '🚀 VIRAL VIDEOS', 'These videos are exploding! Consider making similar content.', '#ef4444');
    }

    // Trending Videos Section
    if (trending.length > 0) {
      html += this.generateVideoSection(trending, '🔥 TRENDING VIDEOS', 'Hot topics getting massive traction right now.', '#f97316');
    }

    // Rising Videos Section
    if (rising.length > 0) {
      html += this.generateVideoSection(rising, '📈 RISING VIDEOS', 'Videos gaining momentum - potential opportunities.', '#22c55e');
    }

    // No outperformers message
    if (totalOutperformers === 0) {
      html += `
    <div style="background: #1a1a2e; border-radius: 12px; padding: 30px; text-align: center; border: 1px solid #333; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 12px;">🌙</div>
      <h3 style="margin: 0 0 8px 0; color: #fff;">No Major Outperformers Today</h3>
      <p style="margin: 0; color: #888; font-size: 14px;">
        The AI niche is quiet today. This could be a great opportunity for you to post!
      </p>
    </div>
`;
    }

    html += `
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #333; margin-top: 24px;">
      <p style="margin: 0 0 8px 0;">🤖 Automated by YouTube Outperformer Tracker</p>
      <p style="margin: 0 0 8px 0;">API Credits Used: ${creditsUsed} | Total Videos Scanned: ${totalVideosFound}</p>
      <p style="margin: 0;">The Solo Entrepreneur • AI Automation</p>
    </div>
    
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Generate a section of videos
   */
  generateVideoSection(videos, title, subtitle, accentColor) {
    let html = `
    <!-- ${title} Section -->
    <div style="background: #1a1a2e; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #333; border-left: 4px solid ${accentColor};">
      <h2 style="margin: 0 0 4px 0; font-size: 18px; color: ${accentColor};">${title}</h2>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #888;">${subtitle}</p>
`;

    for (const video of videos.slice(0, 10)) { // Limit to 10 per section
      html += `
      <!-- Video Card -->
      <div style="background: #0f0f0f; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #2a2a2a;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <a href="${video.link}" target="_blank" style="color: #fff; text-decoration: none;">
              <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; line-height: 1.4;">${video.title}</h4>
            </a>
            <p style="margin: 0; font-size: 12px; color: #888;">
              ${video.channel.name} ${video.channel.verified ? '✓' : ''}
            </p>
          </div>
          ${this.getStatusBadge(video.status)}
        </div>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; margin-bottom: 10px;">
          <span style="color: #00d4ff;">👁️ ${this.formatViews(video.views)} views</span>
          <span style="color: #a855f7;">⏱️ ${video.publishedTime}</span>
          <span style="color: #888;">📏 ${video.length || 'N/A'}</span>
          <span style="color: #666;">🔍 "${video.keyword}"</span>
        </div>
        <a href="${video.link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: 600;">
          Watch Video →
        </a>
      </div>
`;
    }

    html += `
    </div>
`;
    return html;
  }

  /**
   * Generate plain text email content (fallback)
   */
  generateEmailText(data, reportDate) {
    const { viral, trending, rising, keywordsSearched, creditsUsed } = data;
    const dateStr = reportDate.toLocaleDateString('en-IN');

    let text = `🔥 AI NICHE OUTPERFORMERS REPORT - ${dateStr}\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `📊 Summary:\n`;
    text += `   • 🚀 Viral: ${viral.length}\n`;
    text += `   • 🔥 Trending: ${trending.length}\n`;
    text += `   • 📈 Rising: ${rising.length}\n`;
    text += `   • 🔍 Keywords Searched: ${keywordsSearched}\n`;
    text += `   • 💰 Credits Used: ${creditsUsed}\n\n`;

    const allVideos = [...viral, ...trending, ...rising];

    if (allVideos.length === 0) {
      text += `🌙 No major outperformers today!\n`;
      return text;
    }

    for (const video of allVideos.slice(0, 15)) {
      text += `${video.status.emoji} ${video.title}\n`;
      text += `   👁️ ${this.formatViews(video.views)} views | ⏱️ ${video.publishedTime}\n`;
      text += `   📺 ${video.channel.name}\n`;
      text += `   🔗 ${video.link}\n\n`;
    }

    return text;
  }

  /**
   * Send the daily report email
   */
  async sendDailyReport(data) {
    const reportDate = new Date();
    const { viral = [], trending = [], rising = [] } = data;
    const totalOutperformers = viral.length + trending.length + rising.length;

    const mailOptions = {
      from: `"YouTube AI Tracker 🔥" <${this.fromEmail}>`,
      to: this.toEmail,
      subject: `🔥 ${totalOutperformers} AI Outperformers Found! | ${reportDate.toLocaleDateString('en-IN')}`,
      text: this.generateEmailText(data, reportDate),
      html: this.generateEmailHTML(data, reportDate)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail() {
    const testData = {
      viral: [{
        title: 'AI Tool That Made Me $10K in One Week',
        views: 500000,
        publishedTime: '5 hours ago',
        length: '12:30',
        link: 'https://youtube.com/watch?v=test1',
        channel: { name: 'Test Channel', verified: true },
        keyword: 'AI tools 2024',
        status: { level: 'viral', emoji: '🚀' }
      }],
      trending: [{
        title: 'ChatGPT Just Changed Everything',
        views: 150000,
        publishedTime: '12 hours ago',
        length: '8:45',
        link: 'https://youtube.com/watch?v=test2',
        channel: { name: 'AI Creator', verified: false },
        keyword: 'ChatGPT tutorial',
        status: { level: 'trending', emoji: '🔥' }
      }],
      rising: [{
        title: 'No-Code App That Makes $5K/Month',
        views: 35000,
        publishedTime: '18 hours ago',
        length: '15:20',
        link: 'https://youtube.com/watch?v=test3',
        channel: { name: 'Indie Hacker', verified: false },
        keyword: 'no code app',
        status: { level: 'rising', emoji: '📈' }
      }],
      keywordsSearched: 25,
      totalVideosFound: 450,
      creditsUsed: 125
    };

    return this.sendDailyReport(testData);
  }
}

export default EmailService;
