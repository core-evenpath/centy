# Firebase Integration for Broadcast & Campaigns

## Overview
This document outlines the Firebase Firestore integration for `/partner/broadcast` and `/partner/campaigns` pages, including integration with `/partner/contacts`.

## Implementation Summary

### 1. Created `broadcast-actions.ts`
**Location**: `/src/actions/broadcast-actions.ts`

**Key Features**:
- **Broadcast Groups**: CRUD operations for managing recipient groups
- **Campaigns**: Full campaign lifecycle management (create, update, delete, send)
- **Firestore Collections**:
  - `partners/{partnerId}/broadcastGroups` - Stores recipient groups
  - `partners/{partnerId}/campaigns` - Stores all campaigns

**Main Functions**:
- `getBroadcastGroupsAction()` - Fetch all groups for a partner
- `createBroadcastGroupAction()` - Create new recipient group
- `updateBroadcastGroupAction()` - Update group details/members
- `deleteBroadcastGroupAction()` - Delete a group
- `getCampaignsAction()` - Fetch all campaigns
- `createCampaignAction()` - Create new campaign (draft/scheduled/sent)
- `updateCampaignAction()` - Update campaign details
- `deleteCampaignAction()` - Delete a campaign
- `sendCampaignAction()` - Mark campaign as sent and update metrics

### 2. Data Models

#### BroadcastGroup
```typescript
{
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  contactIds: string[];  // References to contacts from /partner/contacts
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### BroadcastCampaign
```typescript
{
  id: string;
  partnerId: string;
  title: string;
  channel: 'whatsapp' | 'telegram' | 'email';
  status: 'sent' | 'scheduled' | 'draft';
  message: string;
  hasImage: boolean;
  imageUrl?: string;
  buttons: string[];
  
  // Recipients
  recipientType: 'group' | 'individual' | 'all';
  groupIds?: string[];      // References to broadcastGroups
  contactIds?: string[];    // References to contacts
  recipientCount: number;
  
  // Scheduling
  sentAt?: Timestamp;
  scheduledFor?: Timestamp;
  
  // Metrics (for sent campaigns)
  delivered?: number;
  read?: number;
  replied?: number;
  clicked?: number;
  failed?: number;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. Integration Points

#### Broadcast Page (`/partner/broadcast`)
**Current State**: Uses hardcoded `GROUPS` and `CLIENTS` arrays

**Changes Needed**:
1. Replace hardcoded groups with Firestore data from `broadcastGroups` collection
2. Integrate with `/partner/contacts` to fetch actual contacts
3. In `RecipientsStep`, replace mock data with real contacts
4. Save campaigns to Firestore when creating/editing
5. Add real-time listeners for groups and contacts

#### Campaigns Page (`/partner/campaigns`)
**Current State**: Uses hardcoded `CAMPAIGNS` array

**Changes Needed**:
1. Replace hardcoded campaigns with Firestore data
2. Fetch campaigns from `campaigns` collection
3. Add real-time updates using Firestore listeners
4. Enable campaign management (duplicate, delete, reschedule)

#### Contacts Integration
**Already Done**: `/partner/contacts` is fully integrated with Firestore

**Benefits**:
- Single source of truth for contact data
- Real-time sync across broadcast and contacts pages
- Contact groups can be used for broadcast targeting

### 4. Firestore Structure

```
partners/
  {partnerId}/
    contacts/           # Already exists
      {contactId}/
        - name
        - phone
        - email
        - groups
        - ...
    
    broadcastGroups/    # NEW
      {groupId}/
        - name
        - description
        - contactIds[]  # References to contacts
        - createdAt
        - updatedAt
    
    campaigns/          # NEW
      {campaignId}/
        - title
        - channel
        - status
        - message
        - recipientType
        - contactIds[] or groupIds[]
        - metrics (delivered, read, replied)
        - createdAt
        - sentAt / scheduledFor
```

### 5. Next Steps

#### Step 1: Update Broadcast Page
- [ ] Add Firestore real-time listeners for contacts and groups
- [ ] Replace GROUPS constant with dynamic data
- [ ] Replace CLIENTS constant with contacts from Firestore
- [ ] Update RecipientsStep to work with real data
- [ ] Save campaigns when completing the flow

#### Step 2: Update Campaigns Page
- [ ] Add Firestore real-time listener for campaigns
- [ ] Replace CAMPAIGNS constant with dynamic data
- [ ] Implement campaign actions (duplicate, delete, send)
- [ ] Add filters and sorting for Firestore queries

#### Step 3: Create Group Management UI
- [ ] Add "Manage Groups" modal in broadcast page
- [ ] Allow creating/editing/deleting groups
- [ ] Integrate group selector with contacts

#### Step 4: Testing
- [ ] Test campaign creation flow
- [ ] Test recipient selection (groups vs individuals)
- [ ] Test campaign metrics tracking
- [ ] Test real-time updates

### 6. Security Considerations

**Firestore Rules** (to be added):
```javascript
match /partners/{partnerId}/broadcastGroups/{groupId} {
  allow read, write: if request.auth != null 
    && request.auth.token.partnerId == partnerId;
}

match /partners/{partnerId}/campaigns/{campaignId} {
  allow read, write: if request.auth != null 
    && request.auth.token.partnerId == partnerId;
}
```

### 7. Implementation Notes

- All server actions use `firebase-admin` for server-side operations
- Client-side uses regular Firebase SDK with real-time listeners
- Timestamps are properly converted between server and client
- Contact references ensure data integrity
- Metrics are tracked for sent campaigns

## Files Modified/Created

1. **Created**: `/src/actions/broadcast-actions.ts`
2. **To Update**: `/src/app/partner/(protected)/broadcast/page.tsx`
3. **To Update**: `/src/app/partner/(protected)/campaigns/page.tsx`
4. **Reference**: `/src/app/partner/(protected)/contacts/page.tsx` (already integrated)
