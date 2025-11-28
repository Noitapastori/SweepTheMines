# SweepTheMines

RPG inventory and equipment management system built with React (Vite). Features drag-and-drop item management, character attributes with equipment bonuses, and interactive item tooltips.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview build

## Features
- **Inventory System**: 20-slot inventory grid for storing items
- **Equipment Slots**: 8 equipment slots (weapon, off-hand, armor, 4 accessories, shield)
- **Drag & Drop**: Drag items between inventory and equipment, swap items within slots
- **Item Attributes**: Equipment provides stat bonuses (Strength, Dexterity, Vitality, Magic)
- **Character Stats**: Real-time stat calculation showing base values and bonuses
- **Item Tooltips**: Hover over items to see properties and attribute bonuses
- **Visual Feedback**: Equipment bonuses displayed in green, hover effects on slots

## Item Database
- **Sword**: +5 Strength (Attack power 15-20)
- **Armor**: +5 Vitality (Defense 12)
- **Shield**: +5 Magic (Magic Defense 10)

## Architecture
- `src/components/GameUI.jsx`: Main RPG UI component with state management for inventory, equipment, and drag-drop
- `src/App.jsx`: Entry point, renders GameUI component
- `src/styles.css`: Styling using Jacquard 24 font, custom CSS variables, and Figma design tokens

## UX Details
- Inventory slots show item preview with grab cursor
- Equipment slots highlight in cyan when equipped, green on hover of equipped items
- Empty slots show 30% opacity
- Item tooltips appear on hover with yellow title and gray properties
- Dragging shows grabbing cursor with reduced opacity for visual feedback
