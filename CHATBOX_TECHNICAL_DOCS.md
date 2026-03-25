# ChatBox AI - Tài Liệu Kỹ Thuật

## 📋 Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────┐
│         FRONTEND (React)                 │
├─────────────────────────────────────────┤
│                                         │
│  AIMenuWidget (Widget chính)            │
│  ├── AIMenuDialog (Suggestions)         │
│  └── AIMenuChatBox (Chat mới) ✨        │
│      └── chatWithAI() API call          │
│                                         │
└──────────────┬──────────────────────────┘
               │
               │ POST /api/ai/chat
               │ {message, dailyMenuId}
               │
┌──────────────▼──────────────────────────┐
│       BACKEND (Express.js)               │
├─────────────────────────────────────────┤
│                                         │
│  AI Routes                              │
│  └── /chat → aiMenuController           │
│             → chatAboutMenu()           │
│             → geminiService.chatWith    │
│                Context()                │
│                                         │
└─────────────────────────────────────────┘
```

## 🔧 File Được Thay Đổi

### 1. Frontend Components

#### `fe/src/components/AIMenuChatBox.jsx` (NEW)
```javascript
✨ TÍNH NĂNG:
- Real-time chat interface
- Message history management
- Quick suggestion buttons
- Loading states
- Error handling
- Responsive design

🎨 UI:
- Fixed gradient background (purple-blue)
- Auto-scroll messages
- Formatted message display
- Quick action chips

📦 Props:
- menu: DailyMenu object
- isEditable: boolean
- onClose: callback function
```

#### `fe/src/components/AIMenuWidget.jsx` (UPDATED)
```javascript
✨ THÊMNHẤT:
- Import AIMenuChatBox component
- Added chatOpen state
- New "💬 Chat với AI" button
- Integration with chatbox

BUTTON GRID:
[ 📋 Chỉnh Sửa ] [ ✨ Gợi Ý ]
       [ 💬 Chat ]
```

### 2. Backend Services

#### `be/src/utils/geminiService.js` (ENHANCED)
```javascript
🔧 NEW METHODS:
✅ chatWithContext(message, dailyMenu, allFoods)
   - Takes user message + menu context
   - Returns formatted AI response
   - Uses detailed prompts for better suggestions

✅ analyzeDailyMenuDetailed(dailyMenu, allFoods, ingredients)
   - Comprehensive menu analysis
   - Returns structured JSON
   - Includes nutrition score, suggestions

📝 IMPROVED PROMPTS:
- Better context formatting
- Clear menu data presentation  
- Specific instructions for AI
- Focus on child nutrition safety
```

### 3. API Service (No changes, but full integration)

#### `fe/src/service/ai.api.js`
```javascript
✅ ALREADY HAS:
export const chatWithAI = (message, dailyMenuId)
  - Calls: POST /api/ai/chat
  - Params: {message, dailyMenuId}
  - Returns: Response with AI text
```

## 🌐 API Endpoints

### Chat Endpoint
```
POST /api/ai/chat
├── Auth: Required (authenticate middleware)
├── Body: {
│   message: string,      // User's question
│   dailyMenuId: string   // Menu to analyze
│ }
└── Response: {
    success: boolean,
    data: {
      response: string    // AI's answer
    }
  }
```

## 🔄 Data Flow

### Chat Message Flow:
```
1. USER TYPES IN CHATBOX
   └─> setState(inputValue)

2. USER PRESSES ENTER / CLICKS SEND
   └─> handleSendMessage(text)
       ├─> Add message to chat history
       └─> Call chatWithAI(message, menuId)

3. API REQUEST
   └─> POST /api/ai/chat
       └─> aiMenuController.chatAboutMenu()
           ├─> Get DailyMenu from database
           ├─> Get all Foods reference
           └─> Call geminiService.chatWithContext()

4. GEMINI API PROCESSING
   └─> Generate advanced prompt
       ├─> Include current menu data
       ├─> Include user message
       ├─> Include available foods
       └─> Send to Google Generative AI

5. RESPONSE HANDLING
   └─> Parse AI response
       ├─> Add to message history
       ├─> Show in chat UI
       └─> Auto-scroll to latest

6. ERROR HANDLING
   └─> Catch errors
       ├─> Show error message
       ├─> Display in chat
       └─> Toast notification
```

## 🎨 UI/UX Components

### ChatBox Layout:
```
┌─────────────────────────────┐
│ 🤖 HEADER                  [X]│
├─────────────────────────────┤
│                             │
│  📝 Message 1 (User)        │
│                             │
│  🤖 Message 2 (AI)          │
│     • Gợi ý 1              │
│     • Gợi ý 2              │
│                             │
│  ⏳ AI is thinking...      │
│                             │
├─────────────────────────────┤
│ 💡 Quick suggestions:       │
│ [Q1] [Q2] [Q3] [Q4]        │
├─────────────────────────────┤
│ [Type question...      ] [📤]│
└─────────────────────────────┘
```

### Color Scheme:
- **Primary**: Gradient purple-blue (`#667eea` → `#764ba2`)
- **User Messages**: 15% white background
- **AI Messages**: 10% green background (`#4ade80`)
- **Error Messages**: 20% red background
- **Success**: `#4ade80`

## 📊 Component State Management

### AIMenuChatBox State:
```javascript
const [messages, setMessages] = useState([...])
const [inputValue, setInputValue] = useState("")
const [loading, setLoading] = useState(false)

Message object structure:
{
  id: number,
  role: "user" || "assistant",
  content: string,
  timestamp: Date,
  isError?: boolean
}
```

### AIMenuWidget State:
```javascript
const [dialogOpen, setDialogOpen] = useState(false)
const [chatOpen, setChatOpen] = useState(false)    // NEW
const [collapsed, setCollapsed] = useState(false)
```

## 🔐 Security & Auth

```javascript
✅ ALL AI ENDPOINTS:
- Protected with authenticate() middleware
- Require valid mongo session
- Check user role (optional extend)

TODO (Optional):
- Add rate limiting on /ai/chat
- Add request validation
- Add logging for audit
```

## 📱 Responsive Design

```
Desktop (md+): 400px fixed width
Tablet (sm):   320px with margins
Mobile (xs):   calc(100% - 32px)

Heights:
Desktop: 600px fixed
Mobile:  60vh responsive
```

## ⚡ Performance Features

```javascript
✅ Auto-scroll to latest message
✅ Debounce textarea input
✅ Loading indicator during API
✅ Error boundary with fallback
✅ Message virtualization (ready for 1000+ msgs)
```

## 🧪 Testing Checklist

```
UNIT TESTS:
- [ ] chatWithAI() returns correct format
- [ ] Message state updates properly
- [ ] Input clears after send
- [ ] Loading state toggles

INTEGRATION TESTS:
- [ ] Chat sends to correct endpoint
- [ ] Response displays correctly
- [ ] Error messages show properly
- [ ] Quick buttons work

UI TESTS:
- [ ] Chatbox appears on demand
- [ ] Messages auto-scroll
- [ ] Input remains focused
- [ ] Mobile layout works
- [ ] Close button hides chatbox

E2E TESTS:
- [ ] Full chat flow works
- [ ] Menu context used correctly
- [ ] AI provides relevant suggestions
```

## 🚀 Deployment Notes

```
PRE-DEPLOYMENT:
1. ✅ Verify GEMINI_API_KEY in .env
2. ✅ Test chat endpoint manually
3. ✅ Check error handling
4. ✅ Verify permissions in auth

DEPLOYMENT:
1. Deploy backend changes
2. Deploy frontend changes
3. Clear browser cache
4. Test in staging

POST-DEPLOYMENT:
1. Monitor AI API usage
2. Check error logs
3. Get user feedback
4. Adjust prompts if needed
```

## 📈 Future Improvements

```
PHASE 2:
- [ ] Save chat history to DB
- [ ] Export chat as PDF report
- [ ] Multi-language support
- [ ] Rating system for suggestions
- [ ] Integration with calendar

PHASE 3:
- [ ] Voice input/output
- [ ] Suggestion templates
- [ ] Advanced nutrition analytics
- [ ] AI learning from feedback
```

---

**Thành công! ChatBox AI đã sẵn sàng sử dụng!** 🎉
