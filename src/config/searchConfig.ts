import { SearchConfig, DEFAULT_SEARCH_CONFIG } from '@/types/search';

/**
 * Creates a search configuration by merging default values with provided overrides
 * @param overrides Partial configuration to override defaults
 * @returns Complete search configuration
 */
export function createSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig {
  return {
    ...DEFAULT_SEARCH_CONFIG,
    ...overrides
  };
}

/**
 * Validates a search configuration to ensure values are within acceptable ranges
 * @param config The configuration to validate
 * @returns Validated configuration with any invalid values corrected
 */
export function validateSearchConfig(config: SearchConfig): SearchConfig {
  return {
    matchThreshold: Math.max(0, Math.min(0.99, config.matchThreshold)),
    matchCount: Math.max(1, Math.min(50, config.matchCount)),
    batchSize: Math.max(1, Math.min(20, config.batchSize))
  };
}

/**
 * Creates a validated search configuration
 * @param overrides Partial configuration to override defaults
 * @returns Validated search configuration
 */
export function createValidatedSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig {
  const config = createSearchConfig(overrides);
  return validateSearchConfig(config);
}

/**
 * Gets environment-specific search configuration
 * Can be extended to read from environment variables or other sources
 */
export function getEnvironmentSearchConfig(): Partial<SearchConfig> {
  // This can be extended to read from environment variables
  // or other configuration sources
  return {};
}

/**
 * Creates a search configuration from environment and overrides
 * @param overrides Partial configuration to override defaults and environment settings
 * @returns Validated search configuration
 */
export function getSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig {
  const envConfig = getEnvironmentSearchConfig();
  return createValidatedSearchConfig({
    ...envConfig,
    ...overrides
  });
}

// Export the default configuration for convenience
export { DEFAULT_SEARCH_CONFIG };