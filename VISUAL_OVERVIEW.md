# Visual Implementation Overview

## Screen Flow Diagram

```
┌─────────────┐
│   Inbox     │
│  (List of   │
│  Chats)     │
└──────┬──────┘
       │ Tap chat
       ▼
┌──────────────────────────────────┐
│  Chat Screen                      │
│ ┌──────────────────────────────┐ │
│ │ < Inbox  Project X  [✏️] [🗑️] │  ← Header with title & actions
│ ├──────────────────────────────┤ │
│ │ [👤] [👤] [👤]               │  ← Participants section
│ │ Alice Bob Charlie             │
│ ├──────────────────────────────┤ │
│ │                              │ │
│ │      Message List            │ │
│ │ (Messages appear here)       │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ [Text Input] [Send]          │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## Inbox Item Structure

### Before Implementation
```
┌────────────────────────────────┐
│ [👤] John Doe              2h │
│      Last message preview...  │
│      >                        │
└────────────────────────────────┘
```

### After Implementation
```
┌────────────────────────────────┐
│ [👤] Weekend Trip         2h │  ← Shows custom title
│      Last message preview...  │
│      >                        │
└────────────────────────────────┘
```

---

## Chat Header Design

### Title Section
```
┌────────────────────────────────────────┐
│  < Inbox    Weekend Trip    [✏️] [🗑️]   │
└────────────────────────────────────────┘
    ↑                ↑          ↑    ↑
    │                │          │    └─ Delete button
    │                │          └────── Edit button
    │                └───────────────── Custom title
    └──────────────────────────────── Back button
```

### Title Editing Mode
```
┌────────────────────────────────────────┐
│  < Inbox    [Edit Title...][✓][✗]     │
└────────────────────────────────────────┘
                   ↑         ↑  ↑
                   │         │  └─ Cancel
                   │         └────── Save
                   └────────────────── Input field
```

### Participants Section
```
┌────────────────────────────────────────┐
│  [👤]    [👤]    [👤]    [👤]         │
│  Alice   Bob     Charlie  Dave        │
└────────────────────────────────────────┘
   ↑       ↑       ↑        ↑
   │       │       │        └─ Fourth participant
   │       │       └────────── Third participant
   │       └───────────────── Second participant
   └──────────────────────── First participant
```

---

## State Management Flow

```
Component Mounts
    ↓
useEffect (Boot)
    ├─ Fetch conversation doc
    ├─ Get custom title
    └─ Fetch all participant profiles
    ↓
State Updated
    ├─ customTitle ← from Firestore
    ├─ allParticipants ← from user API
    └─ isEditingTitle ← false
    ↓
Component Renders
    ├─ Header with title
    ├─ Participants section
    └─ Messages list
    ↓
User Interacts
    ├─ Tap edit → isEditingTitle = true
    ├─ Enter text → editingTitle = input
    └─ Tap save → updateConversationTitle()
    ↓
Firestore Updated
    └─ conversation.title = new value
    ↓
Real-time Listener
    ├─ Detects change
    └─ Updates customTitle state
    ↓
UI Re-renders
    └─ Shows new title everywhere
```

---

## Component Hierarchy

```
InboxScreen
├─ SafeAreaView
│  ├─ Header
│  │  ├─ Back Button
│  │  └─ Title "Inbox"
│  └─ FlatList
│     └─ ConversationItem (renders for each chat)
│        ├─ Avatar
│        ├─ Title (or username if no title)
│        ├─ Last message
│        └─ Timestamp

ChatScreen
├─ KeyboardAvoidingView
│  ├─ Header View
│  │  ├─ Back & "Inbox" button
│  │  ├─ Title or Edit Input
│  │  └─ Edit [✏️] / Delete [🗑️] buttons
│  ├─ Participants Section (NEW)
│  │  └─ FlatList (horizontal)
│  │     └─ ParticipantCard
│  │        ├─ Avatar
│  │        └─ Name
│  ├─ Messages FlatList
│  │  └─ MessageItem
│  │     ├─ Avatar
│  │     ├─ Message text/media
│  │     └─ Reactions
│  └─ Input Section
│     ├─ TextInput
│     ├─ Media Button
│     └─ Send Button
```

---

## Data Structure

### Firestore Schema
```
Conversations Collection
│
├─ {conversationId}
│  ├─ id: "user1_user2"
│  ├─ participants: ["user1", "user2"]
│  ├─ lastMessage: "Hey, how are you?"
│  ├─ lastMessageAt: Timestamp
│  ├─ lastMessageBy: "user1"
│  ├─ title: "Weekend Trip"  ← NEW
│  ├─ createdAt: Timestamp
│  │
│  └─ messages/ (Subcollection)
│     ├─ {messageId1}
│     │  ├─ text: "Hello!"
│     │  ├─ senderId: "user1"
│     │  ├─ createdAt: Timestamp
│     │  ├─ read: true
│     │  └─ reactions: {"👍": ["user2"]}
│     │
│     └─ {messageId2}
│        └─ ...
```

---

## API Call Flow

### Saving Title
```
User Input
    ↓
handleSaveTitle()
    ↓
updateConversationTitle(convId, title)
    ↓
Firestore updateDoc()
    ↓
Firebase returns confirmation
    ↓
Update local state (customTitle)
    ↓
UI re-renders with new title
```

### Deleting Conversation
```
User Taps Delete
    ↓
Show Alert Dialog
    ↓
User Confirms
    ↓
handleDeleteConversation()
    ├─ Set deleting = true
    │
    ├─ deleteConversation(convId)
    │  ├─ Fetch all messages
    │  ├─ Delete each message
    │  └─ Delete conversation doc
    │
    ├─ Set deleting = false
    │
    └─ navigation.goBack()
       ↓
       Back to Inbox
```

---

## UI Color Scheme

```
Header
├─ Background: Colors.dark.tint (Green #077f5f)
├─ Text: Colors.light.tint (White)
└─ Icons: Colors.light.tint

Edit Mode
├─ Input: White background
├─ Save Button: Green (#10b981)
└─ Cancel Button: Red (#ef4444)

Participants
├─ Background: Colors.dark.tint
├─ Names: Colors.light.tint
└─ Divider: #e5e7eb

Messages
├─ My Message: Blue (#1e3a6e)
└─ Other Message: Gray (#f3f4f6)
```

---

## Responsive Design

### Mobile (iPhone SE)
```
┌──────────────────┐
│ < Inbox  Title   │
├──────────────────┤
│ [👤] [👤]       │
│ Name Name       │
├──────────────────┤
│ Messages...     │
└──────────────────┘
```

### Tablet (iPad)
```
┌──────────────────────────────────┐
│ < Inbox    Custom Title    [✏️][🗑️]│
├──────────────────────────────────┤
│ [👤] [👤] [👤] [👤] [👤]         │
│ Name Name Name Name Name          │
├──────────────────────────────────┤
│ Messages...                       │
└──────────────────────────────────┘
```

---

## Interaction Patterns

### Edit Title Flow
```
Normal State          Edit State          Saving State
┌─────────────┐      ┌─────────────┐    ┌─────────────┐
│ Title [✏️]  │  →   │ [Input...] │ →  │ Saving...   │
│             │      │ [✓] [✗]    │    │             │
└─────────────┘      └─────────────┘    └─────────────┘
```

### Delete Flow
```
Click Delete
    ↓
Alert Shown
├─ Cancel → Return to chat
└─ Delete → Show loading → Delete → Go to Inbox
```

---

## Event Handlers Map

```
User Action          Handler              Firebase Operation
─────────────────────────────────────────────────────────────
Tap Edit             setIsEditingTitle()  None
Type Title           setEditingTitle()    None
Tap Save             handleSaveTitle()    updateConversationTitle()
Tap Cancel           Clear states         None
Tap Delete           Show Alert           None
Confirm Delete       handleDelete...()    deleteConversation()
Open Chat            Boot Effect          subscribeToMessages()
Leave Chat           useEffect cleanup    unsubscribe()
```

---

## Performance Optimization Points

```
Component
├─ Memoized participant rendering
├─ Efficient key extraction
├─ Lazy image loading
└─ Debounced scroll events

Network
├─ Single boot fetch
├─ Real-time subscriptions
├─ Batch operations
└─ Proper error handling

Memory
├─ Cleanup subscriptions on unmount
├─ Proper state management
└─ No memory leaks
```

---

## Fallback & Error States

```
Missing Avatar
    ↓
Show Initials
    ↓
"A" for Alice
"B" for Bob

Missing Name
    ↓
Show "User"

Title Loading
    ↓
Show Participant Name

Participants Loading
    ↓
Show Empty (graceful)

Network Error
    ↓
Show Error + Retry
```

---

## Summary Visualization

```
┌─────────────────────────────────────────────────────────┐
│           CHAT APPLICATION FEATURE MAP                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Inbox Screen              Chat Screen                  │
│  ┌────────────────────┐   ┌────────────────────┐       │
│  │ List Conversations │   │ Title + Participants│       │
│  │ • Show Title       │   │ • Edit Title       │       │
│  │ • Fallback Name    │   │ • Delete Chat      │       │
│  │ • Last Message     │   │ • Show Avatars     │       │
│  │ • Timestamp        │   │ • Show Names       │       │
│  └────────────────────┘   │ • Messages         │       │
│            ↓              │ • Send Messages    │       │
│     Tap Conversation      └────────────────────┘       │
│            ↓                    ↑                      │
│  ┌────────────────────────────────┐                    │
│  │    Firebase Firestore          │                    │
│  │  conversations/{convId}         │                    │
│  │  ├─ title (optional)            │                    │
│  │  ├─ participants                │                    │
│  │  ├─ lastMessage                 │                    │
│  │  └─ messages/ (subcollection)   │                    │
│  └────────────────────────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

This visual overview completes the implementation documentation!

