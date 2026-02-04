#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 YouTube Outperformer Tracker - One-Click Deployment Script
# ═══════════════════════════════════════════════════════════════
# 
# This script will automatically set up everything on your VPS!
# Just run: bash deploy.sh
#
# ═══════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 YOUTUBE OUTPERFORMER TRACKER - DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Update system
echo "📦 Step 1/7: Updating system..."
apt update -y > /dev/null 2>&1
echo "   ✅ Done"

# Step 2: Check/Install Node.js
echo "📦 Step 2/7: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi
echo "   ✅ Node.js $(node --version)"

# Step 3: Install PM2
echo "📦 Step 3/7: Installing PM2..."
npm install -g pm2 > /dev/null 2>&1
echo "   ✅ PM2 installed"

# Step 4: Create project directory
echo "📁 Step 4/7: Creating project..."
mkdir -p /root/youtube-tracker/config
mkdir -p /root/youtube-tracker/services
cd /root/youtube-tracker

# Step 5: Create all files
echo "📝 Step 5/7: Creating files..."

# package.json
cat > package.json << 'ENDFILE'
{
  "name": "youtube-outperformer-tracker",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node index.js", "test": "node index.js --test" },
  "dependencies": { "axios": "^1.6.7", "node-cron": "^3.0.3", "nodemailer": "^6.9.9", "dotenv": "^16.4.1" }
}
ENDFILE

# .env
cat > .env << 'ENDFILE'
SCRAPINGDOG_API_KEY=69836153abcf6ce8c899dbf3
GMAIL_USER=prithalbhardwaj@gmail.com
GMAIL_APP_PASSWORD=vajl oyjk vlto qvzr
EMAIL_TO=prithalbhardwaj@gmail.com
TIMEZONE=Asia/Kolkata
ENDFILE

# config/keywords.js
cat > config/keywords.js << 'ENDFILE'
export const SEARCH_KEYWORDS = [
  "AI tools 2024", "ChatGPT tutorial", "Claude AI", "AI automation", "AI agents",
  "no code app", "automation workflow", "n8n automation", "make automation", "zapier tutorial",
  "AI for business", "AI startup ideas", "AI side hustle", "make money with AI",
  "AI news today", "best AI tools", "AI productivity", "AI coding", "vibe coding",
  "cursor AI", "midjourney tutorial", "AI video generator", "AI voice cloning"
];
export const OUTPERFORMER_THRESHOLDS = {
  last24Hours: { minimum: 10000, trending: 50000, viral: 200000 },
  last48Hours: { minimum: 25000, trending: 100000, viral: 500000 },
  lastWeek: { minimum: 50000, trending: 200000, viral: 1000000 }
};
export default { SEARCH_KEYWORDS, OUTPERFORMER_THRESHOLDS };
ENDFILE

# services/scrapingdog.js
cat > services/scrapingdog.js << 'ENDFILE'
import axios from 'axios';
const BASE_URL = 'https://api.scrapingdog.com/youtube';
class ScrapingDogService {
  constructor(apiKey) { this.apiKey = apiKey; this.requestCount = 0; }
  async searchVideos(query, options = {}) {
    const params = { api_key: this.apiKey, search_query: query.replace(/\s+/g, '+'), country: 'us', language: 'en' };
    console.log(`🔍 Searching: "${query}"`);
    const response = await axios.get(`${BASE_URL}/search`, { params, timeout: 30000 });
    this.requestCount++;
    return response.data;
  }
  getCreditsUsed() { return this.requestCount * 5; }
}
export default ScrapingDogService;
ENDFILE

# services/videoAnalyzer.js
cat > services/videoAnalyzer.js << 'ENDFILE'
import { OUTPERFORMER_THRESHOLDS } from '../config/keywords.js';
export function parsePublishedTime(t) {
  if (!t) return Infinity;
  const m = t.toLowerCase().match(/(\d+)/);
  if (!m) return Infinity;
  const n = parseInt(m[1]);
  if (t.includes('hour')) return n;
  if (t.includes('day')) return n * 24;
  if (t.includes('week')) return n * 168;
  return Infinity;
}
export function parseViewCount(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  let s = v.toString().toUpperCase().replace(/,/g, '').replace(/VIEWS/gi, '').trim();
  if (s.includes('B')) return parseFloat(s) * 1e9;
  if (s.includes('M')) return parseFloat(s) * 1e6;
  if (s.includes('K')) return parseFloat(s) * 1e3;
  return parseInt(s) || 0;
}
export function getOutperformerStatus(views, hoursAgo) {
  let th, tc;
  if (hoursAgo <= 24) { th = OUTPERFORMER_THRESHOLDS.last24Hours; tc = 'last24Hours'; }
  else if (hoursAgo <= 48) { th = OUTPERFORMER_THRESHOLDS.last48Hours; tc = 'last48Hours'; }
  else if (hoursAgo <= 168) { th = OUTPERFORMER_THRESHOLDS.lastWeek; tc = 'lastWeek'; }
  else return { isOutperformer: false, level: 'none' };
  if (views >= th.viral) return { isOutperformer: true, level: 'viral', emoji: '🚀' };
  if (views >= th.trending) return { isOutperformer: true, level: 'trending', emoji: '🔥' };
  if (views >= th.minimum) return { isOutperformer: true, level: 'rising', emoji: '📈' };
  return { isOutperformer: false, level: 'normal' };
}
export function analyzeSearchResults(results, keyword, maxHoursAgo = 48) {
  const out = [];
  for (const src of ['video_results', 'popular_today', 'channels_new_to_you']) {
    const videos = results[src];
    if (!videos) continue;
    for (const v of videos) {
      const h = parsePublishedTime(v.published_date);
      if (h > maxHoursAgo) continue;
      const views = parseViewCount(v.views);
      const status = getOutperformerStatus(views, h);
      if (status.isOutperformer) {
        out.push({ title: v.title, link: v.link, views, publishedTime: v.published_date, channel: { name: v.channel?.name || 'Unknown' }, keyword, status });
      }
    }
  }
  return out;
}
export function deduplicateVideos(videos) {
  const seen = new Map();
  for (const v of videos) if (!seen.has(v.link)) seen.set(v.link, v);
  return Array.from(seen.values());
}
export function sortByPerformance(videos) {
  const ord = { viral: 0, trending: 1, rising: 2 };
  return videos.sort((a, b) => (ord[a.status.level] || 3) - (ord[b.status.level] || 3) || b.views - a.views);
}
export function groupByPerformance(videos) {
  return { viral: videos.filter(v => v.status.level === 'viral'), trending: videos.filter(v => v.status.level === 'trending'), rising: videos.filter(v => v.status.level === 'rising') };
}
ENDFILE

# services/emailService.js
cat > services/emailService.js << 'ENDFILE'
import nodemailer from 'nodemailer';
class EmailService {
  constructor(c) {
    this.transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: c.user, pass: c.appPassword } });
    this.from = c.user; this.to = c.toEmail;
  }
  fmt(v) { return v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toString(); }
  badge(s) {
    const b = { viral: '#ef4444', trending: '#f97316', rising: '#22c55e' };
    return `<span style="background:${b[s.level]};color:#fff;padding:3px 8px;border-radius:12px;font-size:10px;">${s.emoji} ${s.level.toUpperCase()}</span>`;
  }
  html(d, dt) {
    const { viral, trending, rising, creditsUsed } = d;
    let h = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial;background:#0f0f0f;color:#fff;">
    <div style="max-width:700px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;padding:30px;text-align:center;margin-bottom:24px;">
    <h1 style="margin:0 0 8px 0;">🔥 AI Outperformers</h1><p style="margin:0;opacity:0.9;">${dt.toLocaleDateString('en-IN')}</p></div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
    <div style="flex:1;background:#1a1a2e;padding:16px;text-align:center;border-radius:12px;"><div style="font-size:24px;color:#ef4444;">${viral.length}</div><div style="font-size:10px;color:#888;">🚀 Viral</div></div>
    <div style="flex:1;background:#1a1a2e;padding:16px;text-align:center;border-radius:12px;"><div style="font-size:24px;color:#f97316;">${trending.length}</div><div style="font-size:10px;color:#888;">🔥 Trending</div></div>
    <div style="flex:1;background:#1a1a2e;padding:16px;text-align:center;border-radius:12px;"><div style="font-size:24px;color:#22c55e;">${rising.length}</div><div style="font-size:10px;color:#888;">📈 Rising</div></div></div>`;
    for (const v of [...viral,...trending,...rising].slice(0,15)) {
      h += `<div style="background:#1a1a2e;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;"><a href="${v.link}" style="color:#fff;text-decoration:none;font-weight:600;">${v.title}</a>${this.badge(v.status)}</div>
      <div style="font-size:12px;color:#888;margin-top:8px;">👁️ ${this.fmt(v.views)} | ⏱️ ${v.publishedTime} | 📺 ${v.channel.name}</div>
      <a href="${v.link}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 14px;border-radius:6px;font-size:11px;text-decoration:none;margin-top:10px;">Watch →</a></div>`;
    }
    h += `<div style="text-align:center;padding:20px;color:#666;font-size:12px;">💰 Credits: ${creditsUsed}</div></div></body></html>`;
    return h;
  }
  async sendDailyReport(d) {
    const dt = new Date();
    const total = d.viral.length + d.trending.length + d.rising.length;
    await this.transporter.sendMail({
      from: `"YouTube Tracker 🔥" <${this.from}>`, to: this.to,
      subject: `🔥 ${total} AI Outperformers Found! | ${dt.toLocaleDateString('en-IN')}`,
      html: this.html(d, dt)
    });
    console.log('✅ Email sent!');
  }
}
export default EmailService;
ENDFILE

# index.js
cat > index.js << 'ENDFILE'
import dotenv from 'dotenv';
import cron from 'node-cron';
import ScrapingDogService from './services/scrapingdog.js';
import { analyzeSearchResults, deduplicateVideos, sortByPerformance, groupByPerformance } from './services/videoAnalyzer.js';
import EmailService from './services/emailService.js';
import { SEARCH_KEYWORDS } from './config/keywords.js';

dotenv.config();
const CONFIG = {
  apiKey: process.env.SCRAPINGDOG_API_KEY,
  gmail: { user: process.env.GMAIL_USER, appPassword: process.env.GMAIL_APP_PASSWORD, toEmail: process.env.EMAIL_TO },
  tz: process.env.TIMEZONE || 'Asia/Kolkata'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toString();

async function run() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔥 YOUTUBE AI OUTPERFORMER TRACKER');
  console.log('═'.repeat(60));
  console.log(`📅 ${new Date().toLocaleString('en-IN', { timeZone: CONFIG.tz })}`);
  console.log(`🔍 Searching ${SEARCH_KEYWORDS.length} keywords\n`);

  const api = new ScrapingDogService(CONFIG.apiKey);
  const email = new EmailService(CONFIG.gmail);
  let all = [], total = 0;

  for (let i = 0; i < SEARCH_KEYWORDS.length; i++) {
    const kw = SEARCH_KEYWORDS[i];
    try {
      console.log(`[${i+1}/${SEARCH_KEYWORDS.length}] Searching: "${kw}"`);
      const res = await api.searchVideos(kw);
      const cnt = (res.video_results?.length||0) + (res.popular_today?.length||0);
      total += cnt;
      const out = analyzeSearchResults(res, kw, 48);
      if (out.length > 0) { console.log(`   ✅ Found ${out.length} outperformer(s)!`); all.push(...out); }
      else console.log(`   📹 Scanned ${cnt} videos`);
    } catch (e) { console.log(`   ❌ Error: ${e.message}`); }
    if (i < SEARCH_KEYWORDS.length - 1) await sleep(1500);
  }

  all = sortByPerformance(deduplicateVideos(all));
  const grp = groupByPerformance(all);

  console.log('\n' + '═'.repeat(60));
  console.log(`🚀 Viral: ${grp.viral.length} | 🔥 Trending: ${grp.trending.length} | 📈 Rising: ${grp.rising.length}`);
  console.log(`💰 Credits: ${api.getCreditsUsed()}`);
  console.log('═'.repeat(60));

  if (all.length > 0) {
    console.log('\n🏆 TOP:\n');
    for (const v of all.slice(0, 5)) console.log(`${v.status.emoji} ${v.title.substring(0,50)}... | ${fmt(v.views)} views\n`);
  }

  console.log('\n📧 Sending email...');
  try { await email.sendDailyReport({ ...grp, creditsUsed: api.getCreditsUsed() }); }
  catch (e) { console.error('❌', e.message); }
}

async function main() {
  if (process.argv.includes('--test')) { await run(); process.exit(0); }
  console.log('\n🚀 Started! Runs daily at 2 PM IST\n');
  cron.schedule('0 14 * * *', run, { timezone: CONFIG.tz });
}

process.on('SIGINT', () => process.exit(0));
main();
ENDFILE

echo "   ✅ All files created"

# Step 6: Install npm packages
echo "📦 Step 6/7: Installing packages..."
npm install > /dev/null 2>&1
echo "   ✅ Packages installed"

# Step 7: Start with PM2
echo "🚀 Step 7/7: Starting automation..."
pm2 delete youtube-tracker > /dev/null 2>&1
pm2 start index.js --name youtube-tracker
pm2 save > /dev/null 2>&1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Your YouTube Outperformer Tracker is now LIVE!"
echo "✅ It will run automatically every day at 2:00 PM IST"
echo "✅ Emails will be sent to: prithalbhardwaj@gmail.com"
echo ""
echo "📋 Useful commands:"
echo "   pm2 status              - Check if running"
echo "   pm2 logs youtube-tracker - View logs"
echo "   npm run test            - Run manually now"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
