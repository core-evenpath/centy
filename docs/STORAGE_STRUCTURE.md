# Firebase Storage Structure

## Overview
This document outlines the storage folder structure for the Centy platform.

## Folder Structure

### `/chat/{partnerId}/whatsapp/`
WhatsApp communication media files, organized by partner.

#### Subfolders:
- **`incoming/`** - Media received from customers via WhatsApp
  - Images, videos, documents, audio sent by customers
  - Naming: `{timestamp}_{mediaId}.{extension}`
  - Metadata includes: partnerId, mediaId, source, uploadedAt
  
- **`outgoing/`** - Media sent by partner to customers
  - Images, videos, documents, audio sent from CommSpace
  - Naming: `{timestamp}_{filename}`
  - Used for rich media messages

**Training Data Usage:** This folder can be accessed for AI training purposes to improve customer service responses and analyze customer communication patterns.

### `/vault/` (Reserved)
Secure storage for sensitive partner documents and uploads.
- Partner onboarding documents
- Legal agreements
- Sensitive business files

### `/ai-generated/` (Future)
AI-generated assets and content.

### `/public/` (Future)
Publicly accessible assets like logos, profile pictures, etc.

## Access Patterns

### Incoming Media (Webhook)
```
Meta WhatsApp → Webhook → Download → Upload to /chat/{partnerId}/whatsapp/incoming/
```

### Outgoing Media (Partner Upload)
```
Partner Upload → Firebase Storage Client → /chat/{partnerId}/whatsapp/outgoing/
```

## Security Rules (To Be Implemented)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Chat media - Partner can read their own, write outgoing
    match /chat/{partnerId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == partnerId;
      allow write: if request.auth != null && request.auth.uid == partnerId 
                   && allPaths.matches('.*whatsapp/outgoing/.*');
    }
    
    // Vault - Partner-specific secure storage
    match /vault/{partnerId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == partnerId;
    }
  }
}
```

## Training Data Access

For AI training purposes:
1. Media is stored with structured metadata
2. Access can be granted via service account for ML pipelines
3. PII should be redacted before training
4. Customer consent may be required based on jurisdiction

## Cleanup Policy (Recommended)

- **Incoming media**: Retain for 90 days, then archive or delete
- **Outgoing media**: Retain for 12 months
- **Training data**: Archive with proper consent documentation

