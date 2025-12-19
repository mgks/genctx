const { generateContextFile } = require('./generator');
const { DEFAULT_CONFIG } = require('./config');

/**
 * Programmatic API for genctx.
 * 
 * @param {object} options - Configuration options
 * @returns {Promise<void>}
 */
async function generate(options = {}) {
    // Merge user options with defaults
    const config = {
        ...DEFAULT_CONFIG,
        ...options,
        options: {
            ...DEFAULT_CONFIG.options,
            ...(options.options || {})
        }
    };
    
    // Ensure arrays are set if missing
    if (!config.include) config.include = DEFAULT_CONFIG.include;
    if (!config.exclude) config.exclude = DEFAULT_CONFIG.exclude;

    return generateContextFile(config);
}

module.exports = { generate };