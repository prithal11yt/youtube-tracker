/**
 * ScrapingDog YouTube API Service
 * Handles all interactions with the ScrapingDog API
 */

import axios from 'axios';

const BASE_URL = 'https://api.scrapingdog.com/youtube';

class ScrapingDogService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.requestCount = 0;
    }

    /**
     * Search YouTube for videos matching a query
     * @param {string} query - Search query
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Search results
     */
    async searchVideos(query, options = {}) {
        try {
            const url = `${BASE_URL}/search`;
            const params = {
                api_key: this.apiKey,
                search_query: query.replace(/\s+/g, '+'),  // Replace spaces with + for URL encoding
                country: options.country || 'us',
                language: options.language || 'en',
                ...options.sp && { sp: options.sp }
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

    /**
     * Get channel information and videos
     * @param {string} channelId - YouTube channel handle (e.g., @MattWolfe)
     * @returns {Promise<Object>} Channel data with videos
     */
    async getChannelData(channelId) {
        try {
            const url = `${BASE_URL}/channel`;
            const params = {
                api_key: this.apiKey,
                channel_id: channelId,
                country: 'us'
            };

            console.log(`📡 Fetching channel: ${channelId}`);
            const response = await axios.get(url, { params, timeout: 30000 });
            this.requestCount++;

            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching channel ${channelId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get detailed video information
     * @param {string} videoId - YouTube video ID
     * @returns {Promise<Object>} Detailed video data
     */
    async getVideoData(videoId) {
        try {
            const url = `${BASE_URL}/video`;
            const params = {
                api_key: this.apiKey,
                v: videoId
            };

            console.log(`🎬 Fetching video details: ${videoId}`);
            const response = await axios.get(url, { params, timeout: 30000 });
            this.requestCount++;

            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching video ${videoId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get the number of API requests made
     */
    getRequestCount() {
        return this.requestCount;
    }

    /**
     * Calculate credits used (5 credits per request)
     */
    getCreditsUsed() {
        return this.requestCount * 5;
    }
}

export default ScrapingDogService;
