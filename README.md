# YouTube Outperformer Tracker 🔥

An AI automation that finds outperforming YouTube videos in the AI/no-code/automation niche and sends you daily email reports.

## Features

- 🔍 Searches 23+ AI-related keywords daily
- 📈 Identifies viral, trending, and rising videos
- 📧 Sends beautiful HTML email reports
- ⏰ Runs automatically at 2 PM IST

## Quick Deploy to VPS

SSH into your VPS and run:

```bash
git clone https://github.com/YOUR_USERNAME/youtube-tracker.git
cd youtube-tracker
npm install
# Edit .env with your credentials
pm2 start index.js --name youtube-tracker
```

## Setup

1. Clone this repo
2. Copy `.env.example` to `.env`
3. Fill in your API keys
4. Run `npm install`
5. Run `npm test` to verify
6. Run `npm start` for production

## License

MIT
