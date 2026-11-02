import { getAdapter } from "./driver.js";
import { getSettings, updateSettings, isCloudEnabled, getCloudUrl } from "./repos/settingsRepo.js";
import { getProviderConnections, getProviderConnectionById, createProviderConnection, updateProviderConnection, deleteProviderConnection, deleteProviderConnectionsByProvider, reorderProviderConnections, cleanupProviderConnections } from "./repos/connectionsRepo.js";
import { getProviderNodes, getProviderNodeById, createProviderNode, updateProviderNode, deleteProviderNode } from "./repos/nodesRepo.js";
import { getProxyPools, getProxyPoolById, createProxyPool, updateProxyPool, deleteProxyPool } from "./repos/proxyPoolsRepo.js";
import { getApiKeys, getApiKeyById, getApiKeyByKey, createApiKey, updateApiKey, deleteApiKey, validateApiKey } from "./repos/apiKeysRepo.js";
import { getCombos, getComboById, getComboByName, createCombo, updateCombo, deleteCombo } from "./repos/combosRepo.js";
import { getModelAliases, setModelAlias, deleteModelAlias, getCustomModels, addCustomModel, deleteCustomModel, getMitmAlias, setMitmAliasAll, getPricing, getPricingForModel, updatePricing, resetPricing, resetAllPricing } from "./repos/aliasRepo.js";
import { getUsageHistory, getUsageStats, saveRequestUsage } from "./repos/usageRepo.js";
import { getDisabledModels, getDisabledByProvider, disableModels, enableModels } from "./repos/disabledModelsRepo.js";
import { saveRequestDetail, getRequestDetails, getRequestDetailById, getDistinctProviders } from "./repos/requestDetailsRepo.js";
import { initKv, kvGet, kvSet, kvDel, kvClear } from "./repos/kvRepo.js";

export {
  getAdapter,
  getSettings, updateSettings, isCloudEnabled, getCloudUrl,
  getProviderConnections, getProviderConnectionById, createProviderConnection, updateProviderConnection, deleteProviderConnection, deleteProviderConnectionsByProvider, reorderProviderConnections, cleanupProviderConnections,
  getProviderNodes, getProviderNodeById, createProviderNode, updateProviderNode, deleteProviderNode,
  getProxyPools, getProxyPoolById, createProxyPool, updateProxyPool, deleteProxyPool,
  getApiKeys, getApiKeyById, getApiKeyByKey, createApiKey, updateApiKey, deleteApiKey, validateApiKey,
  getCombos, getComboById, getComboByName, createCombo, updateCombo, deleteCombo,
  getModelAliases, setModelAlias, deleteModelAlias, getCustomModels, addCustomModel, deleteCustomModel, getMitmAlias, setMitmAliasAll, getPricing, getPricingForModel, updatePricing, resetPricing, resetAllPricing,
  getUsageHistory, getUsageStats, saveRequestUsage,
  getDisabledModels, getDisabledByProvider, disableModels, enableModels,
  saveRequestDetail, getRequestDetails, getRequestDetailById, getDistinctProviders,
  initKv, kvGet, kvSet, kvDel, kvClear
};
