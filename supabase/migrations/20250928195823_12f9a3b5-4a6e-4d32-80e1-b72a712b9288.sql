-- First, update existing categories for better naming and descriptions
UPDATE categories SET 
  name = 'Doors & Windows',
  description = 'Doors, windows, frames and glazing systems'
WHERE name = 'Fixtures';

UPDATE categories SET 
  name = 'Electrical & Lighting',
  description = 'Electrical equipment, wiring, switches and lighting'
WHERE name = 'M&E Equipment';

UPDATE categories SET 
  name = 'Wall & Ceiling Finishes',
  description = 'Paint, tiles, wallpaper, plaster and decorative finishes'
WHERE name = 'Finishes';

-- Insert new categories with proper icons and descriptions
INSERT INTO categories (name, description, icon_name, slug, item_count) VALUES
-- Structural & Building Materials
('Concrete & Cement', 'Cement, concrete mixes, ready mix and admixtures', 'Building2', 'concrete-cement', 0),
('Aggregates & Stone', 'Sand, gravel, hardcore, decorative stone and aggregates', 'Grid3X3', 'aggregates-stone', 0),

-- Building Envelope  
('Roofing Materials', 'Roof tiles, sheets, felt, guttering and roofing accessories', 'Home', 'roofing-materials', 0),
('Drainage & Groundworks', 'Drainage pipes, manholes, land drains and groundwork materials', 'Wrench', 'drainage-groundworks', 0),
('External Cladding', 'Render, siding, external wall finishes and cladding systems', 'Building2', 'external-cladding', 0),

-- Services & Infrastructure
('Plumbing & Heating', 'Pipes, boilers, radiators, bathroom suites and heating systems', 'Zap', 'plumbing-heating', 0),
('Ventilation & Air Conditioning', 'Fans, ducting, HVAC equipment and ventilation systems', 'Zap', 'ventilation-hvac', 0),

-- Site & Access Equipment (specifically requested)
('Scaffolding & Access', 'Scaffold poles, boards, towers, ladders and access platforms', 'Grid3X3', 'scaffolding-access', 0),
('Site Support & Props', 'Acrow props, beam clamps, shoring equipment and site support', 'Wrench', 'site-support-props', 0),

-- Fixtures & Fittings
('Ironmongery & Security', 'Hinges, locks, handles, security hardware and door furniture', 'Home', 'ironmongery-security', 0),
('Glazing & Glass', 'Window glass, safety glass, glazing systems and glass products', 'Home', 'glazing-glass', 0),

-- Finishes & Interior
('Flooring Materials', 'Timber flooring, tiles, carpet, vinyl and floor underlays', 'TreePine', 'flooring-materials', 0),
('Kitchen & Bathroom', 'Kitchen units, worktops, bathroom suites and sanitaryware', 'Home', 'kitchen-bathroom', 0),

-- Landscaping & External
('Paving & Driveways', 'Block paving, tarmac, concrete slabs and driveway materials', 'Building2', 'paving-driveways', 0),
('Fencing & Gates', 'Fence panels, posts, gates and security fencing systems', 'Grid3X3', 'fencing-gates', 0),
('Garden & Landscaping', 'Plants, soil, garden materials and landscaping supplies', 'TreePine', 'garden-landscaping', 0),

-- Fixings & Hardware
('Fixings & Fasteners', 'Screws, bolts, anchors, adhesives and fixing systems', 'Wrench', 'fixings-fasteners', 0),
('Safety & Workwear', 'PPE, safety barriers, workwear and site safety equipment', 'Wrench', 'safety-workwear', 0),

-- Catch-All (specifically requested)
('Miscellaneous', 'Items and materials not fitting other specific categories', 'Grid3X3', 'miscellaneous', 0);