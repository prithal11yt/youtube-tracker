/**
 * Video Performance Analyzer
 * Analyzes YouTube search results to find outperforming videos
 */

import { OUTPERFORMER_THRESHOLDS } from '../config/keywords.js';

/**
 * Parse relative time string to hours ago
 * @param {string} publishedTime - e.g., "1 day ago", "3 hours ago", "2 weeks ago"
 * @returns {number} Hours since published
 */
export function parsePublishedTime(publishedTime) {
    if (!publishedTime) return Infinity;

    const time = publishedTime.toLowerCase();

    // Extract number
    const match = time.match(/(\d+)/);
    if (!match) return Infinity;

    const num = parseInt(match[1]);

    if (time.includes('hour')) {
        return num;
    } else if (time.includes('day')) {
        return num * 24;
    } else if (time.includes('week')) {
        return num * 24 * 7;
    } else if (time.includes('month')) {
        return num * 24 * 30;
    } else if (time.includes('year')) {
        return num * 24 * 365;
    }

    return Infinity;
}

/**
 * Parse view count from various formats
 * @param {string|number} views - View count (e.g., "1.2M views", "500K views", "50,000 views")
 * @returns {number} Parsed view count
 */
export function parseViewCount(views) {
    if (typeof views === 'number') return views;
    if (!views) return 0;

    // Remove "views" text and clean up
    let viewStr = views.toString()
        .toUpperCase()
        .replace(/,/g, '')
        .replace(/VIEWS/gi, '')
        .trim();

    if (viewStr.includes('B')) {
        return parseFloat(viewStr) * 1000000000;
    } else if (viewStr.includes('M')) {
        return parseFloat(viewStr) * 1000000;
    } else if (viewStr.includes('K')) {
        return parseFloat(viewStr) * 1000;
    }

    return parseInt(viewStr) || 0;
}

/**
 * Parse video length to seconds
 * @param {string} length - e.g., "10:30", "1:25:30"
 * @returns {number} Duration in seconds
 */
export function parseVideoLength(length) {
    if (!length) return 0;

    const parts = length.split(':').map(p => parseInt(p) || 0);

    if (parts.length === 3) {
        // Hours:Minutes:Seconds
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // Minutes:Seconds
        return parts[0] * 60 + parts[1];
    }

    return 0;
}

/**
 * Determine outperformer status based on views and age
 * @param {number} views - View count
 * @param {number} hoursAgo - Hours since published
 * @returns {Object} Status with level and category
 */
export function getOutperformerStatus(views, hoursAgo) {
    let thresholds;
    let timeCategory;

    if (hoursAgo <= 24) {
        thresholds = OUTPERFORMER_THRESHOLDS.last24Hours;
        timeCategory = 'last24Hours';
    } else if (hoursAgo <= 48) {
        thresholds = OUTPERFORMER_THRESHOLDS.last48Hours;
        timeCategory = 'last48Hours';
    } else if (hoursAgo <= 168) { // 7 days
        thresholds = OUTPERFORMER_THRESHOLDS.lastWeek;
        timeCategory = 'lastWeek';
    } else {
        return { isOutperformer: false, level: 'none', timeCategory: 'old' };
    }

    if (views >= thresholds.viral) {
        return { isOutperformer: true, level: 'viral', timeCategory, emoji: '🚀' };
    } else if (views >= thresholds.trending) {
        return { isOutperformer: true, level: 'trending', timeCategory, emoji: '🔥' };
    } else if (views >= thresholds.minimum) {
        return { isOutperformer: true, level: 'rising', timeCategory, emoji: '📈' };
    }

    return { isOutperformer: false, level: 'normal', timeCategory };
}

/**
 * Extract and analyze videos from search results
 * @param {Object} searchResults - Raw search results from ScrapingDog
 * @param {string} keyword - The search keyword used
 * @param {number} maxHoursAgo - Maximum age of videos to consider (default: 48 hours)
 * @returns {Array} Analyzed videos with outperformer status
 */
export function analyzeSearchResults(searchResults, keyword, maxHoursAgo = 48) {
    const outperformers = [];

    // Sources to check for videos
    const videoSources = [
        { key: 'video_results', label: 'Search Results' },
        { key: 'popular_today', label: 'Popular Today' },
        { key: 'channels_new_to_you', label: 'New Channels' }
    ];

    for (const source of videoSources) {
        const videos = searchResults[source.key];
        if (!videos || !Array.isArray(videos)) continue;

        for (const video of videos) {
            const hoursAgo = parsePublishedTime(video.published_date);

            // Skip old videos
            if (hoursAgo > maxHoursAgo) continue;

            const views = parseViewCount(video.views);
            const status = getOutperformerStatus(views, hoursAgo);

            if (status.isOutperformer) {
                outperformers.push({
                    id: video.link?.split('v=')[1]?.split('&')[0] || video.link,
                    title: video.title,
                    link: video.link,
                    views: views,
                    rawViews: video.views,
                    length: video.length,
                    durationSeconds: parseVideoLength(video.length),
                    publishedTime: video.published_date,
                    hoursAgo: hoursAgo,
                    thumbnail: video.thumbnail?.static || video.thumbnail,
                    channel: {
                        name: video.channel?.name || 'Unknown',
                        link: video.channel?.link,
                        verified: video.channel?.verified || false
                    },
                    keyword: keyword,
                    source: source.label,
                    status: status,
                    description: video.description
                });
            }
        }
    }

    return outperformers;
}

/**
 * Deduplicate videos by ID
 * @param {Array} videos - Array of video objects
 * @returns {Array} Deduplicated videos
 */
export function deduplicateVideos(videos) {
    const seen = new Map();

    for (const video of videos) {
        const id = video.id || video.link;

        if (!seen.has(id)) {
            seen.set(id, video);
        } else {
            // If we've seen this video, keep the one with more metadata
            const existing = seen.get(id);
            if (video.views > existing.views) {
                seen.set(id, video);
            }
        }
    }

    return Array.from(seen.values());
}

/**
 * Sort videos by performance level and views
 * @param {Array} videos - Array of video objects
 * @returns {Array} Sorted videos
 */
export function sortByPerformance(videos) {
    const levelOrder = { viral: 0, trending: 1, rising: 2 };

    return videos.sort((a, b) => {
        // First by level
        const levelDiff = (levelOrder[a.status.level] || 3) - (levelOrder[b.status.level] || 3);
        if (levelDiff !== 0) return levelDiff;

        // Then by views
        return b.views - a.views;
    });
}

/**
 * Group videos by performance level
 * @param {Array} videos - Array of video objects
 * @returns {Object} Grouped videos
 */
export function groupByPerformance(videos) {
    return {
        viral: videos.filter(v => v.status.level === 'viral'),
        trending: videos.filter(v => v.status.level === 'trending'),
        rising: videos.filter(v => v.status.level === 'rising')
    };
}

export default {
    parsePublishedTime,
    parseViewCount,
    parseVideoLength,
    getOutperformerStatus,
    analyzeSearchResults,
    deduplicateVideos,
    sortByPerformance,
    groupByPerformance
};
