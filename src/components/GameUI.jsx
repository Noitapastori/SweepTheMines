/**
 * GameUI Component - RPG-style inventory, equipment, and stats interface
 * Converted from Figma design (xOIfn7gABuRVsrc9Bdahoe)
 */

import React from 'react'

const imgEquipmentSlot = "http://localhost:3845/assets/69467539b3c72783dfaba86b652c7cbbcfd95916.png";
const imgEquipmentSlot1 = "http://localhost:3845/assets/cc40e82fb0761e20f1de48669422c02c661737a2.png";
const imgEquipmentSlot2 = "http://localhost:3845/assets/f508fec2b6fd01dc338001ba9460fd0f9f0705d2.png";
const imgCharacterImage = "http://localhost:3845/assets/afe5cfb23d1e8aaf93e04c038fdb076686c7e1b1.png";

// Equipment slot definitions
const EQUIPMENT_SLOTS = [
  { id: 'weapon', name: 'Weapon' },
  { id: 'offhand', name: 'Off-hand' },
  { id: 'armor', name: 'Armor' },
  { id: 'accessory1', name: 'Accessory 1' },
  { id: 'accessory2', name: 'Accessory 2' },
  { id: 'accessory3', name: 'Accessory 3' },
  { id: 'accessory4', name: 'Accessory 4' },
  { id: 'shield', name: 'Shield' },
];

// Item definitions with attributes and metadata
const ITEMS = {
  '1': {
    id: '1',
    name: 'Sword',
    displayName: 'Sword of Might',
    image: imgEquipmentSlot,
    attributes: {
      strength: 5,
      dexterity: 0,
      vitality: 0,
      magic: 0,
    },
    properties: [
      'Attack power 15 - 20',
      'Strength +5',
    ]
  },
  '2': {
    id: '2',
    name: 'Armor',
    displayName: 'Golden Plate Armor',
    image: imgEquipmentSlot1,
    attributes: {
      strength: 0,
      dexterity: 0,
      vitality: 5,
      magic: 0,
    },
    properties: [
      'Defense 12',
      'Vitality +5',
    ]
  },
  '3': {
    id: '3',
    name: 'Shield',
    displayName: 'Crystal Shield',
    image: imgEquipmentSlot2,
    attributes: {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      magic: 5,
    },
    properties: [
      'Magic Defense 10',
      'Magic +5',
    ]
  },
};

// Base attribute values
const BASE_ATTRIBUTES = {
  strength: 10,
  dexterity: 10,
  vitality: 10,
  magic: 10,
};

export default function GameUI() {
  const [inventory, setInventory] = React.useState(
    Array(20).fill(null)
  );

  const [equipment, setEquipment] = React.useState({
    weapon: ITEMS['1'],
    offhand: ITEMS['2'],
    armor: ITEMS['3'],
    accessory1: null,
    accessory2: null,
    accessory3: null,
    accessory4: null,
    shield: null,
  });

  const [draggedItem, setDraggedItem] = React.useState(null);
  const [dragSource, setDragSource] = React.useState(null);
  const [hoveredItemId, setHoveredItemId] = React.useState(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // Calculate total attribute bonuses from equipped items
  const calculateAttributeBonuses = () => {
    const bonuses = {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      magic: 0,
    };

    Object.values(equipment).forEach(item => {
      if (item && item.attributes) {
        bonuses.strength += item.attributes.strength || 0;
        bonuses.dexterity += item.attributes.dexterity || 0;
        bonuses.vitality += item.attributes.vitality || 0;
        bonuses.magic += item.attributes.magic || 0;
      }
    });

    return bonuses;
  };

  const handleInventoryDragStart = (index, item) => {
    if (!item) return;
    setDraggedItem(item);
    setDragSource({ type: 'inventory', index });
  };

  const handleInventoryMouseEnter = (e, item) => {
    if (!item) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItemId(item.id);
    setTooltipPosition({
      x: rect.right + 8,
      y: rect.top,
    });
  };

  const handleInventoryMouseLeave = () => {
    setHoveredItemId(null);
  };

  const handleEquipmentDragStart = (slotId, item) => {
    if (!item) return;
    setDraggedItem(item);
    setDragSource({ type: 'equipment', slotId });
  };

  const handleEquipmentMouseEnter = (e, item) => {
    if (!item) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItemId(item.id);
    setTooltipPosition({
      x: rect.right + 8,
      y: rect.top,
    });
  };

  const handleEquipmentMouseLeave = () => {
    setHoveredItemId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleInventoryDrop = (index) => {
    if (!draggedItem || !dragSource) return;

    if (dragSource.type === 'equipment') {
      // Moving from equipment to inventory
      const slotId = dragSource.slotId;
      setEquipment(prev => ({
        ...prev,
        [slotId]: null
      }));
      
      setInventory(prev => {
        const newInv = [...prev];
        newInv[index] = draggedItem;
        return newInv;
      });
    } else if (dragSource.type === 'inventory' && dragSource.index !== index) {
      // Swapping items in inventory
      setInventory(prev => {
        const newInv = [...prev];
        [newInv[dragSource.index], newInv[index]] = [newInv[index], newInv[dragSource.index]];
        return newInv;
      });
    }

    setDraggedItem(null);
    setDragSource(null);
  };

  const handleEquipmentDrop = (slotId) => {
    if (!draggedItem || !dragSource) return;

    if (dragSource.type === 'inventory') {
      // Moving from inventory to equipment
      const index = dragSource.index;
      
      // Store what was in equipment (if anything) to move to inventory
      const displacedItem = equipment[slotId];
      
      setEquipment(prev => ({
        ...prev,
        [slotId]: draggedItem
      }));
      
      setInventory(prev => {
        const newInv = [...prev];
        newInv[index] = displacedItem;
        return newInv;
      });
    } else if (dragSource.type === 'equipment' && dragSource.slotId !== slotId) {
      // Swapping items in equipment
      setEquipment(prev => ({
        ...prev,
        [dragSource.slotId]: prev[slotId],
        [slotId]: prev[dragSource.slotId]
      }));
    }

    setDraggedItem(null);
    setDragSource(null);
  };

  const getLeftSlots = () => EQUIPMENT_SLOTS.slice(0, 4);
  const getRightSlots = () => EQUIPMENT_SLOTS.slice(4, 8);
  const attributeBonuses = calculateAttributeBonuses();

  return (
    <div className="game-ui">
      <div className="game-ui-container">
        {/* Inventory Panel */}
        <div className="panel inventory-panel">
          <h2 className="panel-title">Inventory</h2>
          
          <div className="inventory-grid">
            {[...Array(5)].map((_, row) => (
              <div key={row} className="inventory-row">
                {[...Array(4)].map((_, col) => {
                  const index = row * 4 + col;
                  const item = inventory[index];
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`inventory-slot ${item ? 'filled' : 'empty'}`}
                      onDragStart={() => handleInventoryDragStart(index, item)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleInventoryDrop(index)}
                      onMouseEnter={(e) => handleInventoryMouseEnter(e, item)}
                      onMouseLeave={handleInventoryMouseLeave}
                      draggable={!!item}
                      style={{
                        backgroundImage: item ? `url(${item.image})` : 'none',
                        cursor: item ? 'grab' : 'default',
                      }}
                      title={item ? item.name : 'Empty slot'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Panel */}
        <div className="panel equipment-panel">
          <h2 className="panel-title">Equipment</h2>
          
          <div className="equipment-content">
            <div className="equipment-slots-left">
              {getLeftSlots().map((slot) => {
                const item = equipment[slot.id];
                return (
                  <div
                    key={slot.id}
                    className={`equipment-slot ${item ? 'equipped' : 'empty'}`}
                    onDragStart={() => handleEquipmentDragStart(slot.id, item)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleEquipmentDrop(slot.id)}
                    onMouseEnter={(e) => handleEquipmentMouseEnter(e, item)}
                    onMouseLeave={handleEquipmentMouseLeave}
                    draggable={!!item}
                    style={{
                      backgroundImage: item ? `url(${item.image})` : 'none',
                      cursor: item ? 'grab' : 'default',
                    }}
                    title={item ? `${item.name} (Drag to move)` : `${slot.name} (Drag item here)`}
                  />
                );
              })}
            </div>

            <div className="equipment-slots-right">
              {getRightSlots().map((slot) => {
                const item = equipment[slot.id];
                return (
                  <div
                    key={slot.id}
                    className={`equipment-slot ${item ? 'equipped' : 'empty'}`}
                    onDragStart={() => handleEquipmentDragStart(slot.id, item)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleEquipmentDrop(slot.id)}
                    onMouseEnter={(e) => handleEquipmentMouseEnter(e, item)}
                    onMouseLeave={handleEquipmentMouseLeave}
                    draggable={!!item}
                    style={{
                      backgroundImage: item ? `url(${item.image})` : 'none',
                      cursor: item ? 'grab' : 'default',
                    }}
                    title={item ? `${item.name} (Drag to move)` : `${slot.name} (Drag item here)`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="panel stats-panel">
          <div className="character-image" style={{backgroundImage: `url(${imgCharacterImage})`}} />

          <div className="stats-section">
            <h3 className="section-title">Stats</h3>
            
            <div className="stat-row">
              <span className="stat-label">HP</span>
              <div className="stat-bar hp-bar" />
            </div>
            
            <div className="stat-row">
              <span className="stat-label">MP</span>
              <div className="stat-bar mp-bar" />
            </div>
            
            <div className="stat-row">
              <span className="stat-label">EXP</span>
              <div className="stat-bar exp-bar" />
            </div>
            
            <div className="stat-row gold-row">
              <span className="stat-label">Gold:</span>
              <span className="stat-value">12 325</span>
            </div>
          </div>

          <div className="attributes-section">
            <h3 className="section-title">Attributes</h3>
            
            <div className="attribute-row">
              <span className="attribute-label">Strength:</span>
              <div className="attribute-value-group">
                {attributeBonuses.strength > 0 && (
                  <span className="attribute-bonus">+{attributeBonuses.strength}</span>
                )}
                <span className="attribute-value">{BASE_ATTRIBUTES.strength + attributeBonuses.strength}</span>
              </div>
            </div>
            
            <div className="attribute-row">
              <span className="attribute-label">Dexterity:</span>
              <div className="attribute-value-group">
                {attributeBonuses.dexterity > 0 && (
                  <span className="attribute-bonus">+{attributeBonuses.dexterity}</span>
                )}
                <span className="attribute-value">{BASE_ATTRIBUTES.dexterity + attributeBonuses.dexterity}</span>
              </div>
            </div>
            
            <div className="attribute-row">
              <span className="attribute-label">Vitality:</span>
              <div className="attribute-value-group">
                {attributeBonuses.vitality > 0 && (
                  <span className="attribute-bonus">+{attributeBonuses.vitality}</span>
                )}
                <span className="attribute-value">{BASE_ATTRIBUTES.vitality + attributeBonuses.vitality}</span>
              </div>
            </div>
            
            <div className="attribute-row">
              <span className="attribute-label">Magic:</span>
              <div className="attribute-value-group">
                {attributeBonuses.magic > 0 && (
                  <span className="attribute-bonus">+{attributeBonuses.magic}</span>
                )}
                <span className="attribute-value">{BASE_ATTRIBUTES.magic + attributeBonuses.magic}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Tooltip */}
      {hoveredItemId && ITEMS[hoveredItemId] && (
        <div 
          className="item-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 1000,
          }}
        >
          <div className="tooltip-title">{ITEMS[hoveredItemId].displayName}</div>
          {ITEMS[hoveredItemId].properties.map((prop, idx) => (
            <div key={idx} className="tooltip-property">{prop}</div>
          ))}
        </div>
      )}
    </div>
  );
}
