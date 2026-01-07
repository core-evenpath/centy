# Broadcast & Campaigns UX Fixes

## Issue #1: Vertical Scroll Not Working ❌

### Problem
Both `/partner/broadcast` and `/partner/campaigns` pages use `min-h-screen` which doesn't integrate properly with the partner layout system that uses `h-screen` and `overflow-hidden`.

### Root Cause
The partner layout (`/src/app/partner/(protected)/layout.tsx`) is structured as:
```tsx
<div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
  <UnifiedPartnerSidebar />
  <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 pb-nav-safe md:pb-0">
    {children}  // This is where broadcast/campaigns render
  </main>
</div>
```

The parent `<main>` has `overflow-hidden`, so children need to properly implement scrolling.

### Solution Pattern (from `/partner/inbox`)
Looking at how inbox works:
```tsx
return (
  <div className="h-full flex bg-gray-50/30 overflow-hidden">
    {/* Content here */}
  </div>
);
```

Key points:
- Use `h-full` instead of `min-h-screen`
- Add `overflow-hidden` at the root
- Create a nested structure with `overflow-y-auto` on the scrollable area

### Fix for Broadcast Home View

**Current Structure** (lines 275-277):
```tsx
return (
  <div className="min-h-screen bg-stone-50">
    <div className="max-w-3xl mx-auto px-4 py-8">
```

**Should Be**:
```tsx
return (
  <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* All existing content */}
      </div>
    </div>
  </div>
);
```

### Fix for Campaigns Page

**Current Structure** (lines 576-577):
```tsx
return (
  <div className="min-h-screen bg-stone-50">
    <div className="max-w-4xl mx-auto px-4 py-8">
```

**Should Be**:
```tsx
return (
  <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* All existing content */}  
      </div>
    </div>
  </div>
);
```

### Need to Update

1. **Broadcast Page** - `/src/app/partner/(protected)/broadcast/page.tsx`
   - Line 275-277: Wrap main return
   - Ensure all closing tags match
   - The nested structure for `CampaignStudio`, `ReviewStep`, `SuccessView` already return their own divs, so they should be okay

2. **Campaigns Page** - `/src/app/partner/(protected)/campaigns/page.tsx`
   - Line 576-577: Wrap main return  
   - Line 330+ (Campaign detail view): Also needs same fix

---

## Issue #2: Cannot Send Messages from Broadcast ❌

### Problem
The broadcast page doesn't actually send messages - it only creates campaign drafts in Firestore. There's no actual message sending functionality integrated.

### How Inbox Sends Messages

From `/partner/inbox/page.tsx` (lines 244-285):

```tsx
const handleSendMessage = async (textOverride?: string) => {
  const textToSend = textOverride || messageInput.trim();
  if (!textToSend || !selectedConversation || !currentPartnerId) return;

  setSending(true);
  
  try {
    let result;

    // For WhatsApp
    if (selectedConversation.platform === 'meta_whatsapp') {
      result = await sendMetaWhatsAppMessageAction({
        partnerId: currentPartnerId,
        to: selectedConversation.whatsAppData.customerPhone,
        message: textToSend,
        conversationId: selectedConversation.id,
      });
    } 
    // For Telegram
    else if (selectedConversation.platform === 'telegram') {
      result = await sendTelegramMessageAction({
        partnerId: currentPartnerId,
        chatId: selectedConversation.telegramData.chatId,
        message: textToSend,
        conversationId: selectedConversation.id,
      });
    }

    if (result?.success) {
      // Success handling
    } else {
      toast.error(result?.message || 'Failed to send message');
    }
  } catch (err) {
    toast.error('Failed to send message');
  } finally {
    setSending(false);
  }
};
```

### What Broadcast Needs

The broadcast page needs to:

1. **Import the sending actions**:
```tsx
import { sendMetaWhatsAppMessageAction } from '@/actions/meta-whatsapp-actions';
import { sendTelegramMessageAction } from '@/actions/telegram-actions';
```

2. **Create a broadcast send function** that:
   - Loops through all selected recipients
   - Sends the same message to each one
   - Tracks success/failure for each recipient
   - Updates campaign metrics in Firestore

3. **Update the ReviewStep/SuccessView** to actually send messages

### Proposed Solution

Create a new action: `/src/actions/broadcast-send-actions.ts`

```typescript
'use server';

import { sendMetaWhatsAppMessageAction } from './meta-whatsapp-actions';
import { sendTelegramMessageAction } from './telegram-actions';
import { updateCampaignAction } from './broadcast-actions';
import { db } from '@/lib/firebase-admin';

export async function sendBroadcastCampaignAction(
  partnerId: string,
  campaignId: string,
  channel: 'whatsapp' | 'telegram',
  message: string,
  recipientType: 'group' | 'individual' | 'all',
  contactIds?: string[],
  groupIds?: string[]
) {
  try {
    // 1. Get contacts based on selection
    let recipients: Array<{ id: string; phone: string; name?: string }> = [];
    
    if (recipientType === 'all') {
      // Get all contacts
      const contactsSnapshot = await db
        .collection(`partners/${partnerId}/contacts`)
        .get();
      recipients = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        phone: doc.data().phone,
        name: doc.data().name,
      }));
    } else if (recipientType === 'individual' && contactIds) {
      // Get specific contacts
      const contactsPromises = contactIds.map(id =>
        db.collection(`partners/${partnerId}/contacts`).doc(id).get()
      );
      const contactsDocs = await Promise.all(contactsPromises);
      recipients = contactsDocs
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id!,
          phone: doc.data()!.phone,
          name: doc.data()!.name,
        }));
    } else if (recipientType === 'group' && groupIds) {
      // Get contacts from groups
      const groupsPromises = groupIds.map(id =>
        db.collection(`partners/${partnerId}/broadcastGroups`).doc(id).get()
      );
      const groupsDocs = await Promise.all(groupsPromises);
      const allContactIds = groupsDocs
        .filter(doc => doc.exists)
        .flatMap(doc => doc.data()!.contactIds || []);
      
      // Remove duplicates
      const uniqueContactIds = Array.from(new Set(allContactIds));
      
     // Get contact details
      const contactsPromises = uniqueContactIds.map(id =>
        db.collection(`partners/${partnerId}/contacts`).doc(id).get()
      );
      const contactsDocs = await Promise.all(contactsPromises);
      recipients = contactsDocs
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id!,
          phone: doc.data()!.phone,
          name: doc.data()!.name,
        }));
    }

    // 2. Send messages to all recipients
    let delivered = 0;
    let failed = 0;
    const results = [];

    for (const contact of recipients) {
      try {
        let result;
        
        if (channel === 'whatsapp') {
          result = await sendMetaWhatsAppMessageAction({
            partnerId,
            to: contact.phone,
            message,
          });
        } else if (channel === 'telegram') {
          // For Telegram, we need chatId which we don't have here
          // This is a limitation - telegram broadcasts need different handling
          throw new Error('Telegram broadcasts not yet supported');
        }

        if (result?.success) {
          delivered++;
          results.push({ contactId: contact.id, status: 'delivered' });
        } else {
          failed++;
          results.push({ contactId: contact.id, status: 'failed', error: result?.message });
        }
      } catch (error: any) {
        failed++;
        results.push({ contactId: contact.id, status: 'failed', error: error.message });
      }
    }

    // 3. Update campaign with metrics
    await updateCampaignAction(partnerId, campaignId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      recipientCount: recipients.length,
      delivered,
      failed,
      read: 0,
      replied: 0,
    } as any);

    return {
      success: true,
      totalRecipients: recipients.length,
      delivered,
      failed,
      results,
    };
  } catch (error: any) {
    console.error('Error sending broadcast:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}
```

### Integration Steps

1. Create the action file above
2. Import it in broadcast page
3. Update the ReviewStep's "onSend" to call this action
4. Show progress indicator while sending
5. Display results in SuccessView

### Important Limitations

**WhatsApp**:
- ✅ Can send to phone numbers directly
- ✅ Works for individual contacts
- ⚠️ Need to check WhatsApp connection status first

**Telegram**:
- ❌ Requires `chatId` which is only created after a conversation starts
- ❌ Can't broadcast to contacts who haven't messaged the bot first
- 💡 **Solution**: Only allow Telegram broadcasts to contacts who have existing conversations

### Recommended UI Flow

1. **Before sending** - Check platform connectivity:
```tsx
const checkCanSend = async () => {
  if (channel === 'whatsapp') {
    const status = await getEmbeddedSignupStatus(partnerId);
    if (!status.connected) {
      toast.error('WhatsApp not connected');
      return false;
    }
  }
  // Similar for Telegram
  return true;
};
```

2. **During send** - Show progress:
```tsx
Sending to 156 contacts... (45/156 sent)
```

3. **After send** - Show detailed results:
```tsx
✅ 145 delivered
❌ 11 failed
📖 0 read (will update)
💬 0 replied (will update)
```

---

## Summary of Required Changes

### Immediate Fixes (Scrolling):
1. Update broadcast page home view wrapper (3 lines)
2. Update campaigns page wrapper (3 lines)
3. Test scrolling works on both pages

### Feature Addition (Message Sending):
1. Create `/src/actions/broadcast-send-actions.ts` (new file)
2. Import and integrate into broadcast page
3. Update ReviewStep to call send action
4. Update SuccessView to show real metrics
5. Add platform connectivity checks
6. Handle Telegram limitations

### Testing Checklist:
- [ ] Broadcast page scrolls properly
- [ ] Campaigns page scrolls properly
- [ ] Can send WhatsApp broadcast to individual contacts
- [ ] Can send WhatsApp broadcast to groups
- [ ] Can send WhatsApp broadcast to all contacts
- [ ] Campaign metrics update correctly
- [ ] Failed messages are tracked
- [ ] Success/failure stats display accurately
