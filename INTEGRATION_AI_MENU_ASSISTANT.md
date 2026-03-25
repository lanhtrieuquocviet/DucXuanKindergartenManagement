/**
 * INTEGRATION EXAMPLE:
 * How to add AIMenuAssistant to MenuDetails.jsx
 * 
 * Path: fe/src/pages/kitchenStaff/MenuDetails.jsx
 */

// ============ STEP 1: Add import at top of file ============
// Add this line after existing imports:
import AIMenuAssistant from "../../components/AIMenuAssistant";

// ============ STEP 2: Add state for managing selected daily menu ============
// Inside MenuDetail component, add after existing useState hooks:
const [selectedDailyMenuForAI, setSelectedDailyMenuForAI] = useState(null);

// ============ STEP 3: Add function to handle AI feature ============
// Add after existing handler functions:
const handleOpenAIAssistant = (dailyMenuId) => {
  // Find the daily menu data
  const menuData = menu.weeks?.odd || menu.weeks?.even;
  const dailyMenu = Object.values(menuData).find(m => m._id === dailyMenuId);
  setSelectedDailyMenuForAI(dailyMenuId);
};

const handleAIDishCreated = () => {
  // Refresh menu data after AI creates a dish
  fetchMenuDetail();
};

// ============ STEP 4: Add button to cell for AI ============
// Inside WeekTable component's TableCell rendering, add before or after the AddIcon button:
{isEditable && (
  <>
    {/* Existing add button */}
    <IconButton 
      size="small" 
      sx={{ ...existing_styles }}
    >
      <AddIcon sx={{ fontSize: 14 }} />
    </IconButton>
    
    {/* NEW: AI Assistant button */}
    <Tooltip title="AI Hỗ trợ lên thực đơn">
      <IconButton 
        size="small" 
        onClick={() => handleOpenAIAssistant(dayMenu._id)}
        sx={{ 
          mt: 0.5, 
          width: 22, 
          height: 22, 
          bgcolor: 'rgba(139, 92, 246, 0.08)',
          color: '#8b5cf6',
          border: '1px dashed rgba(139, 92, 246, 0.3)',
          borderRadius: 1,
          ml: 0.5
        }}
      >
        <AutoFixIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Tooltip>
  </>
)}

// ============ STEP 5: Add AI Modal Drawer (at bottom of component) ============
// Add this before the final closing tags of the component:

{/* AI Menu Assistant Modal */}
<Dialog 
  open={!!selectedDailyMenuForAI} 
  onClose={() => setSelectedDailyMenuForAI(null)}
  maxWidth="md"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}
>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    🤖 AI Menu Assistant
    <IconButton 
      onClick={() => setSelectedDailyMenuForAI(null)} 
      size="small"
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers sx={{ p: 0 }}>
    {selectedDailyMenuForAI && (
      <AIMenuAssistant 
        dailyMenuId={selectedDailyMenuForAI}
        currentMenu={menu}
        onDishCreated={handleAIDishCreated}
      />
    )}
  </DialogContent>
</Dialog>

// ============ STEP 6: Don't forget imports! ============
// Make sure these are imported at the top:
import { useSnackbar } from "notistack";
import { 
  AutoFixHigh as AutoFixIcon,
  // ... existing imports ...
} from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tooltip from "@mui/material/Tooltip";

// ============ FULL EXAMPLE OF INTEGRATION ============
/*

In MenuDetails.jsx, after the line:
  <IconButton size="small" ... >
    <AddIcon sx={{ fontSize: 14 }} />
  </IconButton>

Add:

  {isEditable && (
    <Tooltip title="AI Hỗ trợ lên thực đơn">
      <IconButton 
        size="small" 
        onClick={() => setSelectedDailyMenuForAI(dayMenu._id)}
        sx={{ 
          mt: 0.5, 
          width: 22, 
          height: 22, 
          bgcolor: 'rgba(139, 92, 246, 0.08)',
          color: '#8b5cf6',
          border: '1px dashed rgba(139, 92, 246, 0.3)',
          borderRadius: 1,
          ml: 0.5,
          "@media (hover: hover)": {
            "&:hover": {
              bgcolor: 'rgba(139, 92, 246, 0.12)'
            }
          }
        }}
      >
        <AutoFixIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Tooltip>
  )}

*/

// ============ STATE MANAGEMENT ============
// In MenuDetail component, add this state:
// const [selectedDailyMenuForAI, setSelectedDailyMenuForAI] = useState(null);

// ============ SAMPLE INTEGRATION: Complete cell rendering ============
/*

<TableCell 
  key={day} 
  sx={{ verticalAlign: "top", p: 1.25, minWidth: 120, ... }}
  onClick={() => isEditable && onCellClick(...)}
>
  <Box>
    {foods.map((food) => (
      <FoodTag key={food._id} food={food} canDelete={isEditable} onDelete={(e) => { ... }} />
    ))}
    {foods.length > 0 && (
      <Stack direction="row" spacing={1.5} mt={0.75} flexWrap="wrap">
        {/* nutrition display */}
      </Stack>
    )}
    {isEditable && (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        {/* Existing Add Icon Button */}
        <IconButton size="small" sx={{ width: 22, height: 22, ... }}>
          <AddIcon sx={{ fontSize: 14 }} />
        </IconButton>
        
        {/* NEW: AI Button */}
        <Tooltip title="AI Hỗ trợ">
          <IconButton 
            size="small" 
            onClick={() => setSelectedDailyMenuForAI(dayMenu._id)}
            sx={{ width: 22, height: 22, ... }}
          >
            <AutoFixIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>
    )}
  </Box>
</TableCell>

*/

// ============ MODAL AT END OF COMPONENT ============
/*

<Dialog 
  open={!!selectedDailyMenuForAI} 
  onClose={() => setSelectedDailyMenuForAI(null)}
  maxWidth="md"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}
>
  <DialogTitle sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    fontWeight: 700
  }}>
    🤖 AI Menu Assistant
    <IconButton 
      onClick={() => setSelectedDailyMenuForAI(null)} 
      size="small"
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers sx={{ p: 0, bgcolor: '#fafafa' }}>
    {selectedDailyMenuForAI && (
      <AIMenuAssistant 
        dailyMenuId={selectedDailyMenuForAI}
        currentMenu={menu}
        onDishCreated={handleAIDishCreated}
      />
    )}
  </DialogContent>
</Dialog>

*/
