# Firestore Security Rules - Meta WhatsApp Integration

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... your existing rules ...
    
    // Meta Phone Mappings - read-only for webhooks, write by authenticated partners
    match /metaPhoneMappings/{phoneNumberId} {
      allow read: if true; // Webhooks need to read this
      allow write: if request.auth != null && 
        request.resource.data.partnerId == request.auth.token.partnerId;
    }

    // Meta WhatsApp Conversations - partner-scoped access
    match /metaWhatsAppConversations/{conversationId} {
      allow read, write: if request.auth != null && 
        resource.data.partnerId == request.auth.token.partnerId;
      allow create: if request.auth != null && 
        request.resource.data.partnerId == request.auth.token.partnerId;
    }

    // Meta WhatsApp Messages - partner-scoped access
    match /metaWhatsAppMessages/{messageId} {
      allow read: if request.auth != null && 
        resource.data.partnerId == request.auth.token.partnerId;
      allow create: if request.auth != null && 
        request.resource.data.partnerId == request.auth.token.partnerId;
      allow update: if request.auth != null && 
        resource.data.partnerId == request.auth.token.partnerId;
    }

    // Meta Message Templates - partner-scoped access
    match /metaMessageTemplates/{templateId} {
      allow read, write: if request.auth != null && 
        resource.data.partnerId == request.auth.token.partnerId;
      allow create: if request.auth != null && 
        request.resource.data.partnerId == request.auth.token.partnerId;
    }

    // Webhook Logs - admin only or server-side
    match /webhookLogs/{logId} {
      allow read: if request.auth != null && 
        request.auth.token.admin == true;
      allow write: if false; // Server-side only via Admin SDK
    }
  }
}
```

## How to Apply

1. Open Firebase Console → Firestore Database → Rules
2. Add the rules above to your existing `firestore.rules`
3. Click "Publish"

## Security Features

- **Partner Isolation**: Each partner can only access their own data
- **Webhook Support**: Phone mappings readable for webhook routing
- **Admin Logs**: Webhook logs only accessible to admins
- **Server-Side Writing**: Webhooks write via Admin SDK (bypasses rules)
