// Public API barrel — all DB functions
import { getAdapter } from "./driver.js";

// Settings
export { getSettings, saveSettings } from "./repos/settingsRepo.js";

// Providers
export { createProviderRow, listProvidersRows, getProviderById, updateProvider, deleteProviderRow } from "./repos/providersRepo.js";

// API keys
export { getApiKeys, getApiKeyById, getApiKeyByKey, createApiKey, updateApiKey, revokeApiKey, listApiKeys, deleteApiKey, validateApiKey } from "./repos/apiKeysRepo.js";

// Usage
export { getUsageHistory, getUsageStats, saveRequestUsage } from "./repos/usageRepo.js";

// Sessions
export { createSessionRecord, getSession, deleteSession, cleanExpiredSessions } from "./repos/sessionsRepo.js";

// Lockout
export { getLockout, setLockout, incrementLockout, clearLockout } from "./repos/lockoutRepo.js";

// Auth
export { getAuthRecord, upsertAuthRecord } from "./repos/authRepo.js";

// Aliases
export { listAliases, getAlias, createAlias, updateAlias, deleteAlias } from "./repos/aliasesRepo.js";

// Request Details
export { saveRequestDetail, getRequestDetails, getRequestDetail } from "./repos/requestDetailsRepo.js";

// Legacy sync accessor
export { getDb } from "../db";
