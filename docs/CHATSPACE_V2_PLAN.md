# ChatSpace v2.0 - Implementation Plan

## Overview
Redesign `/partner/chatspace` with design principles from `/partner/messaging` and integrate with contacts and group chat functionality.

## Phase 1: Contacts Integration (PRIORITY)

### 1.1 Data Model Updates
- **Link conversations to contacts**:
  - Add `contactId` field to `MetaWhatsAppConversation`
  - Auto-match conversations to existing contacts by phone number
  - Create `useEnrichedConversations` hook for ChatSpace (like messaging)

### 1.2 UI Enhancements
- **Contact enrichment in conversation list**:
  - Show contact name instead of phone (when available)
  - Show contact email/company in subtitle
  - Color-coded tags for contact segments
  - "Unknown contact" badge for unmatched conversations

- **Contact quick actions**:
  - Add to contacts (from conversation)
  - View contact details
  - Link to existing contact

### 1.3 Search & Filters
- Search by contact name, email, company, phone
- Filter by:
  - Has contact / No contact
  - Contact tags
  - Last message date
  - Platform (WhatsApp only for now)

---

## Phase 2: Group Chat Support

### 2.1 Data Model
```typescript
interface MetaWhatsAppGroup {
  id: string;
  partnerId: string;
  groupName: string;
  groupDescription?: string;
  participants: Array<{
    waId: string;
    phone: string;
    name?: string;
    contactId?: string;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
  createdBy: string;
  createdAt: Date;
  lastActivityAt: Date;
  messageCount: number;
  isActive: boolean;
  groupAvatar?: string; // Custom uploaded or generated
}
```

### 2.2 Group UI Components
- **Group Creation Modal**:
  - Select multiple contacts
  - Set group name & description
  - Upload group icon (optional)
  - Set group type: Broadcast vs. Discussion

- **Group Chat View**:
  - Show all participants
  - Message attribution (sender name + avatar)
  - Typing indicators for multiple users
  - "X is typing..." status

- **Group Settings**:
  - Edit name/description
  - Add/remove participants
  - Leave group
  - Delete group (admin only)
  - Mute/unmute group

### 2.3 Message Handling
- Track sender for each message in group
- Show sender avatar + name in message bubble
- Group admin controls (if needed)

---

## Phase 3: Design Improvements (from /partner/messaging)

### 3.1 Layout & Structure
```
[380px Sidebar] | [Flexible Chat Area] | [Optional Profile Panel]
```

### 3.2 Key Design Patterns to Adopt:
1. **Fixed width sidebar** (380px) - better than responsive flex
2. **Contact enrichment** - show full contact details
3. **Empty states** - friendly when no conversation selected
4. **Client Profile Panel** - sliding panel for contact details
5. **Search improvements** - search contacts, not just conversations
6. **Grid layout** - cleaner than flex for complex layouts
7. **Notification sound** - audio feedback for new messages

### 3.3 Component Structure
```
ChatSpacePage
├── ConversationList (Sidebar)
│   ├── SearchBar
│   ├── FilterTabs (All | Groups | Direct)
│   ├── NewConversation / NewGroup buttons
│   └── ConversationItems (enriched with contact data)
├── ChatArea (Main)
│   ├── ChatHeader (with group participant count)
│   ├── MessageList (with sender attribution for groups)
│   ├── TypingIndicator
│   └── MessageInput (with attachment, emoji, send)
└── ContactProfilePanel (Sidebar overlay)
    ├── Contact info
    ├── Shared media
    ├── Message history
    └── Quick actions
```

---

## Phase 4: Advanced Features (Future)

### 4.1 Broadcast Lists
- Send to multiple contacts simultaneously
- Like groups but one-way
- No replies visible to others

### 4.2 Templates & Quick Replies
- Save common responses
- Use WhatsApp message templates
- Template variables for personalization

### 4.3 Media Gallery
- Grid view of all shared media
- Filter by type (images, videos, docs)
- Bulk download/delete

### 4.4 Analytics
- Response time tracking
- Message volume charts
- Popular topics/keywords

---

## Implementation Order (Recommended)

### Week 1: Contacts Integration
1. ✅ Add `contactId` to conversation type
2. ✅ Create auto-matching logic (phone → contact)
3. ✅ Update conversation list UI with contact enrichment
4. ✅ Add "Link to contact" action
5. ✅ Improve search to include contact fields

### Week 2: Design Overhaul
1. ✅ Adopt 380px fixed sidebar layout
2. ✅ Create ContactProfilePanel component
3. ✅ Improve empty states
4. ✅ Add filter tabs
5. ✅ Polish animations & transitions

### Week 3: Group Chat Foundation
1. ✅ Create group data model
2. ✅ Build GroupCreationModal
3. ✅ Implement group message attribution
4. ✅ Add group chat UI elements
5. ✅ Test group messaging flow

### Week 4: Polish & Launch
1. ✅ Notification sounds
2. ✅ Typing indicators
3. ✅ Performance optimization
4. ✅ End-to-end testing
5. ✅ Documentation

---

## Technical Considerations

### Database Changes
- Add index on `metaWhatsAppConversations.contactId`
- Create `metaWhatsAppGroups` collection
- Add `groupId` field to messages for group attribution

### API Endpoints Needed
- `POST /api/groups/create` - Create new group
- `POST /api/groups/{id}/add-participant` - Add member
- `DELETE /api/groups/{id}/remove-participant` - Remove member
- `PATCH /api/groups/{id}` - Update group details
- `POST /api/conversations/link-contact` - Link to existing contact

### Hooks to Create
- `useEnrichedMetaConversations` - Merge conversations with contacts
- `useGroups` - Fetch and manage groups
- `useGroupParticipants` - Manage group members
- `useContactMatching` - Auto-match conversations to contacts

---

## Success Metrics
- Conversation → Contact match rate > 80%
- Group chat adoption > 30% of users
- Average response time < 5 minutes
- User satisfaction score > 4.5/5

---

## Notes
- WhatsApp API supports groups natively
- Contact integration is CRITICAL for UX
- Design consistency with /messaging is important
- Mobile responsiveness required for chat area
