# 🚀 Hostinger VPS Deployment Guide (Beginner-Friendly)

This guide will walk you through deploying your YouTube Outperformer Tracker on Hostinger VPS. 
**No technical knowledge required** - just follow the steps!

---

## 📋 Before You Start

Make sure you have:
- ✅ Hostinger KVM 2 VPS (already purchased)
- ✅ Access to Hostinger hPanel
- ✅ Your VPS is running (you can check in hPanel)

---

## Step 1: Access Your Hostinger hPanel

1. Go to [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Log in with your Hostinger account
3. Click on **"VPS"** in the left sidebar
4. Click on your **KVM 2** VPS

---

## Step 2: Get Your VPS Login Details

1. In your VPS dashboard, look for **"SSH Access"** section
2. Note down these details:
   - **IP Address**: (looks like `123.45.67.89`)
   - **Username**: usually `root`
   - **Password**: Click "Show" to reveal it

---

## Step 3: Open Terminal (Browser SSH)

Hostinger has a built-in terminal - **no need to install anything!**

1. In your VPS dashboard, find **"Browser terminal"** or **"SSH Browser"**
2. Click on it to open a terminal window in your browser
3. You might need to enter your root password

> **Alternative**: If you prefer, you can use the Terminal app on your Mac:
> ```
> ssh root@YOUR_VPS_IP
> ```
> Then enter your password when prompted.

---

## Step 4: Install Node.js (Copy & Paste Each Command)

Once you're in the terminal, copy and paste these commands **one by one**.
Press **Enter** after each command and wait for it to finish.

### Command 1: Update your VPS
```bash
apt update && apt upgrade -y
```
⏱️ Wait about 1-2 minutes

### Command 2: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```
⏱️ Wait about 30 seconds

### Command 3: Finish Node.js installation
```bash
apt-get install -y nodejs
```
⏱️ Wait about 1 minute

### Command 4: Verify installation
```bash
node --version
```
✅ You should see something like `v20.x.x`

---

## Step 5: Install PM2 (Keeps Your App Running)

```bash
npm install -g pm2
```
⏱️ Wait about 30 seconds

---

## Step 6: Create Project Folder

```bash
mkdir -p /root/youtube-tracker
cd /root/youtube-tracker
```

---

## Step 7: Upload Your Project Files

### Option A: Using Hostinger File Manager (Easiest! 🌟)

1. Go back to your Hostinger hPanel
2. Look for **"File Manager"** in your VPS dashboard
3. Navigate to `/root/youtube-tracker/`
4. Upload all the files from your `Youtube xtracter` folder:
   - `package.json`
   - `index.js`
   - `.env`
   - `config/` folder
   - `services/` folder

### Option B: Using Terminal (Copy-Paste Method)

If File Manager isn't available, I'll give you commands to create each file.
Just paste these commands one by one:

---

## Step 8: Create Files via Terminal

### 8.1: Create package.json
```bash
cat > /root/youtube-tracker/package.json << 'EOF'
{
  "name": "youtube-outperformer-tracker",
  "version": "1.0.0",
  "description": "AI automation to track outperforming YouTube videos",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node index.js --test"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.9",
    "dotenv": "^16.4.1"
  }
}
EOF
```

### 8.2: Create .env file (YOUR CREDENTIALS)
```bash
cat > /root/youtube-tracker/.env << 'EOF'
SCRAPINGDOG_API_KEY=69836153abcf6ce8c899dbf3
GMAIL_USER=prithalbhardwaj@gmail.com
GMAIL_APP_PASSWORD=vajl oyjk vlto qvzr
EMAIL_TO=prithalbhardwaj@gmail.com
TIMEZONE=Asia/Kolkata
EOF
```

### 8.3: Create config folder and keywords.js
```bash
mkdir -p /root/youtube-tracker/config
cat > /root/youtube-tracker/config/keywords.js << 'EOF'
export const SEARCH_KEYWORDS = [
  "AI tools 2024",
  "ChatGPT tutorial",
  "Claude AI",
  "AI automation",
  "AI agents",
  "no code app",
  "automation workflow",
  "n8n automation",
  "make automation",
  "zapier tutorial",
  "AI for business",
  "AI startup ideas",
  "AI side hustle",
  "make money with AI",
  "AI news today",
  "best AI tools",
  "AI productivity",
  "AI coding",
  "vibe coding",
  "cursor AI",
  "midjourney tutorial",
  "AI video generator",
  "AI voice cloning"
];

export const OUTPERFORMER_THRESHOLDS = {
  last24Hours: { minimum: 10000, trending: 50000, viral: 200000 },
  last48Hours: { minimum: 25000, trending: 100000, viral: 500000 },
  lastWeek: { minimum: 50000, trending: 200000, viral: 1000000 }
};

export default { SEARCH_KEYWORDS, OUTPERFORMER_THRESHOLDS };
EOF
```

### 8.4: Create services folder
```bash
mkdir -p /root/youtube-tracker/services
```

### 8.5: Create scrapingdog.js
```bash
cat > /root/youtube-tracker/services/scrapingdog.js << 'EOF'
import axios from 'axios';
const BASE_URL = 'https://api.scrapingdog.com/youtube';

class ScrapingDogService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.requestCount = 0;
  }

  async searchVideos(query, options = {}) {
    try {
      const url = `${BASE_URL}/search`;
      const params = {
        api_key: this.apiKey,
        search_query: query.replace(/\s+/g, '+'),
        country: options.country || 'us',
        language: options.language || 'en'
      };
      console.log(`🔍 Searching: "${query}"`);
      const response = await axios.get(url, { params, timeout: 30000 });
      this.requestCount++;
      return response.data;
    } catch (error) {
      console.error(`❌ Error searching "${query}":`, error.message);
      throw error;
    }
  }

  getRequestCount() { return this.requestCount; }
  getCreditsUsed() { return this.requestCount * 5; }
}

export default ScrapingDogService;
EOF
```

### 8.6: Create videoAnalyzer.js
```bash
cat > /root/youtube-tracker/services/videoAnalyzer.js << 'EOF'
import { OUTPERFORMER_THRESHOLDS } from '../config/keywords.js';

export function parsePublishedTime(publishedTime) {
  if (!publishedTime) return Infinity;
  const time = publishedTime.toLowerCase();
  const match = time.match(/(\d+)/);
  if (!match) return Infinity;
  const num = parseInt(match[1]);
  if (time.includes('hour')) return num;
  if (time.includes('day')) return num * 24;
  if (time.includes('week')) return num * 24 * 7;
  if (time.includes('month')) return num * 24 * 30;
  return Infinity;
}

export function parseViewCount(views) {
  if (typeof views === 'number') return views;
  if (!views) return 0;
  let viewStr = views.toString().toUpperCase().replace(/,/g, '').replace(/VIEWS/gi, '').trim();
  if (viewStr.includes('B')) return parseFloat(viewStr) * 1000000000;
  if (viewStr.includes('M')) return parseFloat(viewStr) * 1000000;
  if (viewStr.includes('K')) return parseFloat(viewStr) * 1000;
  return parseInt(viewStr) || 0;
}

export function getOutperformerStatus(views, hoursAgo) {
  let thresholds, timeCategory;
  if (hoursAgo <= 24) { thresholds = OUTPERFORMER_THRESHOLDS.last24Hours; timeCategory = 'last24Hours'; }
  else if (hoursAgo <= 48) { thresholds = OUTPERFORMER_THRESHOLDS.last48Hours; timeCategory = 'last48Hours'; }
  else if (hoursAgo <= 168) { thresholds = OUTPERFORMER_THRESHOLDS.lastWeek; timeCategory = 'lastWeek'; }
  else return { isOutperformer: false, level: 'none', timeCategory: 'old' };
  
  if (views >= thresholds.viral) return { isOutperformer: true, level: 'viral', timeCategory, emoji: '🚀' };
  if (views >= thresholds.trending) return { isOutperformer: true, level: 'trending', timeCategory, emoji: '🔥' };
  if (views >= thresholds.minimum) return { isOutperformer: true, level: 'rising', timeCategory, emoji: '📈' };
  return { isOutperformer: false, level: 'normal', timeCategory };
}

export function analyzeSearchResults(searchResults, keyword, maxHoursAgo = 48) {
  const outperformers = [];
  const sources = [
    { key: 'video_results', label: 'Search Results' },
    { key: 'popular_today', label: 'Popular Today' },
    { key: 'channels_new_to_you', label: 'New Channels' }
  ];
  
  for (const source of sources) {
    const videos = searchResults[source.key];
    if (!videos || !Array.isArray(videos)) continue;
    for (const video of videos) {
      const hoursAgo = parsePublishedTime(video.published_date);
      if (hoursAgo > maxHoursAgo) continue;
      const views = parseViewCount(video.views);
      const status = getOutperformerStatus(views, hoursAgo);
      if (status.isOutperformer) {
        outperformers.push({
          id: video.link?.split('v=')[1]?.split('&')[0] || video.link,
          title: video.title, link: video.link, views, rawViews: video.views,
          length: video.length, publishedTime: video.published_date, hoursAgo,
          thumbnail: video.thumbnail?.static || video.thumbnail,
          channel: { name: video.channel?.name || 'Unknown', link: video.channel?.link, verified: video.channel?.verified || false },
          keyword, source: source.label, status, description: video.description
        });
      }
    }
  }
  return outperformers;
}

export function deduplicateVideos(videos) {
  const seen = new Map();
  for (const video of videos) {
    const id = video.id || video.link;
    if (!seen.has(id) || video.views > seen.get(id).views) seen.set(id, video);
  }
  return Array.from(seen.values());
}

export function sortByPerformance(videos) {
  const order = { viral: 0, trending: 1, rising: 2 };
  return videos.sort((a, b) => (order[a.status.level] || 3) - (order[b.status.level] || 3) || b.views - a.views);
}

export function groupByPerformance(videos) {
  return {
    viral: videos.filter(v => v.status.level === 'viral'),
    trending: videos.filter(v => v.status.level === 'trending'),
    rising: videos.filter(v => v.status.level === 'rising')
  };
}

export default { parsePublishedTime, parseViewCount, getOutperformerStatus, analyzeSearchResults, deduplicateVideos, sortByPerformance, groupByPerformance };
EOF
```

### 8.7: Create emailService.js
```bash
cat > /root/youtube-tracker/services/emailService.js << 'EOF'
import nodemailer from 'nodemailer';

class EmailService {
  constructor(config) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.user, pass: config.appPassword }
    });
    this.fromEmail = config.user;
    this.toEmail = config.toEmail;
  }

  formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  }

  getStatusBadge(status) {
    const badges = {
      viral: { bg: '#ef4444', text: '🚀 VIRAL' },
      trending: { bg: '#f97316', text: '🔥 TRENDING' },
      rising: { bg: '#22c55e', text: '📈 RISING' }
    };
    const badge = badges[status.level] || badges.rising;
    return `<span style="background:${badge.bg};color:#fff;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;">${badge.text}</span>`;
  }

  generateEmailHTML(data, reportDate) {
    const { viral, trending, rising, keywordsSearched, totalVideosFound, creditsUsed } = data;
    const dateStr = reportDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#0f0f0f;color:#fff;">
    <div style="max-width:700px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;padding:30px;text-align:center;margin-bottom:24px;">
    <h1 style="margin:0 0 8px 0;font-size:28px;">🔥 AI Niche Outperformers</h1>
    <p style="margin:0;opacity:0.9;font-size:14px;">${dateStr}</p></div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:16px;text-align:center;border:1px solid #333;">
    <div style="font-size:24px;font-weight:700;color:#ef4444;">${viral.length}</div><div style="font-size:10px;color:#888;">🚀 Viral</div></div>
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:16px;text-align:center;border:1px solid #333;">
    <div style="font-size:24px;font-weight:700;color:#f97316;">${trending.length}</div><div style="font-size:10px;color:#888;">🔥 Trending</div></div>
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:16px;text-align:center;border:1px solid #333;">
    <div style="font-size:24px;font-weight:700;color:#22c55e;">${rising.length}</div><div style="font-size:10px;color:#888;">📈 Rising</div></div></div>`;

    const allVideos = [...viral, ...trending, ...rising];
    for (const video of allVideos.slice(0, 15)) {
      html += `<div style="background:#1a1a2e;border-radius:8px;padding:16px;margin-bottom:12px;border:1px solid #333;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
      <a href="${video.link}" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px;">${video.title}</a>
      ${this.getStatusBadge(video.status)}</div>
      <div style="font-size:12px;color:#888;">👁️ ${this.formatViews(video.views)} views | ⏱️ ${video.publishedTime} | 📺 ${video.channel.name}</div>
      <a href="${video.link}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 14px;border-radius:6px;font-size:11px;text-decoration:none;margin-top:10px;">Watch →</a></div>`;
    }
    
    html += `<div style="text-align:center;padding:20px;color:#666;font-size:12px;">
    <p>🤖 YouTube Outperformer Tracker | Credits: ${creditsUsed}</p></div></div></body></html>`;
    return html;
  }

  async sendDailyReport(data) {
    const reportDate = new Date();
    const { viral = [], trending = [], rising = [] } = data;
    const total = viral.length + trending.length + rising.length;
    
    const mailOptions = {
      from: `"YouTube AI Tracker 🔥" <${this.fromEmail}>`,
      to: this.toEmail,
      subject: `🔥 ${total} AI Outperformers Found! | ${reportDate.toLocaleDateString('en-IN')}`,
      html: this.generateEmailHTML(data, reportDate)
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true };
  }
}

export default EmailService;
EOF
```

### 8.8: Create index.js (Main File)
```bash
cat > /root/youtube-tracker/index.js << 'EOF'
import dotenv from 'dotenv';
import cron from 'node-cron';
import ScrapingDogService from './services/scrapingdog.js';
import { analyzeSearchResults, deduplicateVideos, sortByPerformance, groupByPerformance } from './services/videoAnalyzer.js';
import EmailService from './services/emailService.js';
import { SEARCH_KEYWORDS } from './config/keywords.js';

dotenv.config();

const CONFIG = {
  scrapingdogApiKey: process.env.SCRAPINGDOG_API_KEY,
  gmail: { user: process.env.GMAIL_USER, appPassword: process.env.GMAIL_APP_PASSWORD, toEmail: process.env.EMAIL_TO },
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  maxHoursAgo: 48,
  delayBetweenRequests: 1500
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const formatViews = v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(1)+'K' : v.toString();

async function runOutperformerAnalysis() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔥 YOUTUBE AI OUTPERFORMER TRACKER');
  console.log('═'.repeat(60));
  console.log(`📅 ${new Date().toLocaleString('en-IN', { timeZone: CONFIG.timezone })}`);
  console.log(`🔍 Searching ${SEARCH_KEYWORDS.length} keywords\n`);

  const scrapingDog = new ScrapingDogService(CONFIG.scrapingdogApiKey);
  const emailService = new EmailService(CONFIG.gmail);
  let allOutperformers = [], totalVideosFound = 0;

  for (let i = 0; i < SEARCH_KEYWORDS.length; i++) {
    const keyword = SEARCH_KEYWORDS[i];
    try {
      console.log(`[${i+1}/${SEARCH_KEYWORDS.length}] Searching: "${keyword}"`);
      const results = await scrapingDog.searchVideos(keyword);
      const count = (results.video_results?.length || 0) + (results.popular_today?.length || 0);
      totalVideosFound += count;
      const outperformers = analyzeSearchResults(results, keyword, CONFIG.maxHoursAgo);
      if (outperformers.length > 0) {
        console.log(`   ✅ Found ${outperformers.length} outperformer(s)!`);
        allOutperformers.push(...outperformers);
      } else {
        console.log(`   📹 Scanned ${count} videos`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    if (i < SEARCH_KEYWORDS.length - 1) await sleep(CONFIG.delayBetweenRequests);
  }

  allOutperformers = sortByPerformance(deduplicateVideos(allOutperformers));
  const grouped = groupByPerformance(allOutperformers);

  console.log('\n' + '═'.repeat(60));
  console.log(`🚀 Viral: ${grouped.viral.length} | 🔥 Trending: ${grouped.trending.length} | 📈 Rising: ${grouped.rising.length}`);
  console.log(`💰 Credits used: ${scrapingDog.getCreditsUsed()}`);
  console.log('═'.repeat(60));

  if (allOutperformers.length > 0) {
    console.log('\n🏆 TOP OUTPERFORMERS:\n');
    for (const v of allOutperformers.slice(0, 5)) {
      console.log(`${v.status.emoji} ${v.title.substring(0, 50)}...`);
      console.log(`   👁️ ${formatViews(v.views)} | ⏱️ ${v.publishedTime}\n`);
    }
  }

  console.log('\n📧 Sending email...');
  try {
    await emailService.sendDailyReport({ ...grouped, keywordsSearched: SEARCH_KEYWORDS.length, totalVideosFound, creditsUsed: scrapingDog.getCreditsUsed() });
    console.log('✅ Email sent!\n');
  } catch (e) { console.error('❌ Email failed:', e.message); }
  
  return { outperformers: allOutperformers, grouped };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    console.log('\n🧪 Running TEST...\n');
    await runOutperformerAnalysis();
    process.exit(0);
  }

  console.log('\n🚀 YOUTUBE TRACKER STARTED');
  console.log(`📅 Runs daily at 2:00 PM IST`);
  console.log('Press Ctrl+C to stop\n');

  cron.schedule('0 14 * * *', async () => {
    console.log('\n⏰ Scheduled run triggered!');
    await runOutperformerAnalysis();
  }, { timezone: CONFIG.timezone });
}

process.on('SIGINT', () => { console.log('\n👋 Stopping...\n'); process.exit(0); });
main().catch(e => { console.error('Error:', e); process.exit(1); });
EOF
```

---

## Step 9: Install Dependencies

```bash
cd /root/youtube-tracker
npm install
```
⏱️ Wait about 1-2 minutes

---

## Step 10: Test the Automation

```bash
npm run test
```

⏱️ This will take about 1-2 minutes. You should see:
- Keywords being searched
- Outperformers found
- An email sent to your inbox

**Check your email** to make sure it worked!

---

## Step 11: Start the Automation (Runs at 2 PM Daily)

```bash
pm2 start index.js --name youtube-tracker
```

✅ Your automation is now running!

---

## Step 12: Make Sure It Survives Server Restart

```bash
pm2 save
pm2 startup
```

If it shows a command to copy, **copy and paste that command** and press Enter.

---

## 🎉 Done! Your Automation is Live!

Your YouTube Outperformer Tracker is now:
- ✅ Running 24/7 on your Hostinger VPS
- ✅ Will send you emails every day at 2:00 PM IST
- ✅ Will survive server restarts

---

## 📋 Useful Commands

### Check if it's running:
```bash
pm2 status
```

### View logs (what it's doing):
```bash
pm2 logs youtube-tracker
```

### Restart the automation:
```bash
pm2 restart youtube-tracker
```

### Stop the automation:
```bash
pm2 stop youtube-tracker
```

### Run manually right now:
```bash
cd /root/youtube-tracker && npm run test
```

---

## 🆘 Troubleshooting

### "Command not found" error
Make sure you ran Step 4 (Install Node.js) correctly.

### No emails received
1. Check your spam folder
2. Verify your Gmail App Password is correct
3. Check logs: `pm2 logs youtube-tracker`

### API errors
Make sure your ScrapingDog API key has credits.

---

## Need Help?

If you get stuck, send me:
1. The error message you see
2. Which step you're on

I'll help you fix it! 🙌
