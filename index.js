/**
 * YouTube AI Niche Outperformer Tracker
 * 
 * KEYWORD-BASED SEARCH VERSION
 * 
 * This automation:
 * 1. Searches YouTube for AI-related keywords
 * 2. Finds videos that are outperforming (high views for their age)
 * 3. Categorizes them as Viral, Trending, or Rising
 * 4. Sends a daily email report with opportunities
 * 
 * Author: The Solo Entrepreneur
 */

import dotenv from 'dotenv';
import cron from 'node-cron';

import ScrapingDogService from './services/scrapingdog.js';
import {
    analyzeSearchResults,
    deduplicateVideos,
    sortByPerformance,
    groupByPerformance
} from './services/videoAnalyzer.js';
import EmailService from './services/emailService.js';
import { SEARCH_KEYWORDS } from './config/keywords.js';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
    scrapingdogApiKey: process.env.SCRAPINGDOG_API_KEY,
    gmail: {
        user: process.env.GMAIL_USER,
        appPassword: process.env.GMAIL_APP_PASSWORD,
        toEmail: process.env.EMAIL_TO
    },
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    maxHoursAgo: 48, // Look for videos from last 48 hours
    delayBetweenRequests: 1500, // 1.5 seconds between API calls
};

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to run the outperformer analysis
 */
async function runOutperformerAnalysis() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🔥 YOUTUBE AI NICHE OUTPERFORMER TRACKER');
    console.log('═'.repeat(60));
    console.log(`📅 ${new Date().toLocaleString('en-IN', { timeZone: CONFIG.timezone })}`);
    console.log(`🔍 Searching ${SEARCH_KEYWORDS.length} AI-related keywords`);
    console.log(`⏰ Looking for videos from the last ${CONFIG.maxHoursAgo} hours`);
    console.log('═'.repeat(60));
    console.log('\n');

    // Initialize services
    const scrapingDog = new ScrapingDogService(CONFIG.scrapingdogApiKey);
    const emailService = new EmailService(CONFIG.gmail);

    let allOutperformers = [];
    let totalVideosFound = 0;
    const errors = [];

    // Search each keyword
    for (let i = 0; i < SEARCH_KEYWORDS.length; i++) {
        const keyword = SEARCH_KEYWORDS[i];
        const progress = `[${i + 1}/${SEARCH_KEYWORDS.length}]`;

        try {
            console.log(`${progress} Searching: "${keyword}"`);

            // Search YouTube
            const searchResults = await scrapingDog.searchVideos(keyword);

            // Count videos in results
            const videoCount = (searchResults.video_results?.length || 0) +
                (searchResults.popular_today?.length || 0) +
                (searchResults.channels_new_to_you?.length || 0);
            totalVideosFound += videoCount;

            // Analyze for outperformers
            const outperformers = analyzeSearchResults(searchResults, keyword, CONFIG.maxHoursAgo);

            if (outperformers.length > 0) {
                console.log(`   ✅ Found ${outperformers.length} outperformer(s)!`);
                allOutperformers.push(...outperformers);
            } else {
                console.log(`   📹 Scanned ${videoCount} videos, no outperformers`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            errors.push({ keyword, error: error.message });
        }

        // Delay between requests to avoid rate limiting
        if (i < SEARCH_KEYWORDS.length - 1) {
            await sleep(CONFIG.delayBetweenRequests);
        }
    }

    // Deduplicate and sort videos
    console.log('\n📊 Processing results...');
    allOutperformers = deduplicateVideos(allOutperformers);
    allOutperformers = sortByPerformance(allOutperformers);
    const grouped = groupByPerformance(allOutperformers);

    // Summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 ANALYSIS COMPLETE');
    console.log('═'.repeat(60));
    console.log(`🔍 Keywords searched: ${SEARCH_KEYWORDS.length}`);
    console.log(`📹 Total videos scanned: ${totalVideosFound}`);
    console.log(`🚀 Viral videos: ${grouped.viral.length}`);
    console.log(`🔥 Trending videos: ${grouped.trending.length}`);
    console.log(`📈 Rising videos: ${grouped.rising.length}`);
    console.log(`💰 API credits used: ${scrapingDog.getCreditsUsed()}`);

    if (errors.length > 0) {
        console.log(`⚠️  Errors: ${errors.length}`);
    }
    console.log('═'.repeat(60));

    // Display top outperformers
    if (allOutperformers.length > 0) {
        console.log('\n🏆 TOP OUTPERFORMERS:\n');
        for (const video of allOutperformers.slice(0, 5)) {
            console.log(`${video.status.emoji} ${video.title.substring(0, 60)}...`);
            console.log(`   👁️ ${formatViews(video.views)} views | ⏱️ ${video.publishedTime} | 🔍 "${video.keyword}"`);
            console.log(`   📺 ${video.channel.name}`);
            console.log('');
        }
    }

    // Prepare email data
    const emailData = {
        viral: grouped.viral,
        trending: grouped.trending,
        rising: grouped.rising,
        keywordsSearched: SEARCH_KEYWORDS.length,
        totalVideosFound,
        creditsUsed: scrapingDog.getCreditsUsed()
    };

    // Send email report
    console.log('\n📧 Sending email report...');

    try {
        await emailService.sendDailyReport(emailData);
        console.log('✅ Email report sent successfully!\n');
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
    }

    return {
        outperformers: allOutperformers,
        grouped,
        totalVideosFound,
        creditsUsed: scrapingDog.getCreditsUsed(),
        errors
    };
}

/**
 * Format view count for display
 */
function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

/**
 * Validate configuration
 */
function validateConfig() {
    const missing = [];

    if (!CONFIG.scrapingdogApiKey || CONFIG.scrapingdogApiKey === 'your_scrapingdog_api_key_here') {
        missing.push('SCRAPINGDOG_API_KEY');
    }
    if (!CONFIG.gmail.user || CONFIG.gmail.user === 'your_email@gmail.com') {
        missing.push('GMAIL_USER');
    }
    if (!CONFIG.gmail.appPassword || CONFIG.gmail.appPassword === 'your_gmail_app_password_here') {
        missing.push('GMAIL_APP_PASSWORD');
    }
    if (!CONFIG.gmail.toEmail || CONFIG.gmail.toEmail === 'your_email@gmail.com') {
        missing.push('EMAIL_TO');
    }

    if (missing.length > 0) {
        console.error('\n❌ Missing configuration:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease set these in your .env file.\n');
        return false;
    }

    return true;
}

/**
 * Schedule the daily job
 */
function scheduleDailyJob() {
    // Schedule for 2 PM IST every day
    const cronSchedule = '0 14 * * *';

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🚀 YOUTUBE AI OUTPERFORMER TRACKER - STARTED');
    console.log('═'.repeat(60));
    console.log(`📅 Scheduled to run daily at 2:00 PM IST`);
    console.log(`🔍 Tracking ${SEARCH_KEYWORDS.length} AI-related keywords`);
    console.log(`🌐 Timezone: ${CONFIG.timezone}`);
    console.log('═'.repeat(60));
    console.log('\nWaiting for scheduled time... (Press Ctrl+C to stop)\n');

    // Schedule the job
    cron.schedule(cronSchedule, async () => {
        console.log('\n⏰ Scheduled job triggered!\n');
        await runOutperformerAnalysis();
    }, {
        timezone: CONFIG.timezone
    });
}

/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);

    // Check for test mode
    if (args.includes('--test') || args.includes('-t')) {
        console.log('\n🧪 Running in TEST mode...\n');

        if (!validateConfig()) {
            process.exit(1);
        }

        // Run analysis immediately
        await runOutperformerAnalysis();
        process.exit(0);
    }

    // Check for email test
    if (args.includes('--test-email')) {
        console.log('\n📧 Sending test email...\n');

        if (!validateConfig()) {
            process.exit(1);
        }

        const emailService = new EmailService(CONFIG.gmail);
        await emailService.sendTestEmail();
        console.log('✅ Test email sent!\n');
        process.exit(0);
    }

    // Validate config
    if (!validateConfig()) {
        process.exit(1);
    }

    // Start the scheduled job
    scheduleDailyJob();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    process.exit(0);
});

// Run the main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
