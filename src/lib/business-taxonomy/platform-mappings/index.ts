/**
 * Platform Mappings - Main Export
 *
 * Maps Centy business functions to external platform categories
 * (Google, WhatsApp, Telegram, Facebook, etc.)
 */

// Types
export * from './types';

// Registry
export * from './registry';

// Platform-specific configs
export { default as WHATSAPP_CONFIG } from './whatsapp';
