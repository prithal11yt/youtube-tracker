/**
 * AI-Related Search Keywords for YouTube
 * 
 * These keywords will be used to find trending and outperforming
 * videos in the AI/no-code/automation niche
 */

export const SEARCH_KEYWORDS = [
    // Core AI Keywords
    "AI tools 2024",
    "ChatGPT tutorial",
    "Claude AI",
    "AI automation",
    "AI agents",

    // No-Code & Automation
    "no code app",
    "automation workflow",
    "n8n automation",
    "make automation",
    "zapier tutorial",

    // AI for Business
    "AI for business",
    "AI startup ideas",
    "AI side hustle",
    "make money with AI",

    // Trending AI Topics
    "AI news today",
    "best AI tools",
    "AI productivity",
    "AI coding",
    "vibe coding",

    // Specific AI Tools
    "cursor AI",
    "midjourney tutorial",
    "AI video generator",
    "AI voice cloning"
];

// View thresholds to identify outperformers
// Videos with more than these views in the given timeframe are considered outperforming
export const OUTPERFORMER_THRESHOLDS = {
    // For videos published in last 24 hours
    last24Hours: {
        minimum: 10000,      // At least 10K views
        trending: 50000,     // 50K+ is trending
        viral: 200000        // 200K+ is viral
    },
    // For videos published in last 48 hours
    last48Hours: {
        minimum: 25000,
        trending: 100000,
        viral: 500000
    },
    // For videos published in last 7 days
    lastWeek: {
        minimum: 50000,
        trending: 200000,
        viral: 1000000
    }
};

// Video length preferences (in seconds)
export const VIDEO_LENGTH_PREFERENCES = {
    shorts: { min: 0, max: 60 },
    short: { min: 61, max: 300 },      // 1-5 minutes
    medium: { min: 301, max: 900 },    // 5-15 minutes
    long: { min: 901, max: 3600 }      // 15-60 minutes
};

export default {
    SEARCH_KEYWORDS,
    OUTPERFORMER_THRESHOLDS,
    VIDEO_LENGTH_PREFERENCES
};
