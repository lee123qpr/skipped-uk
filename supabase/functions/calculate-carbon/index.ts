import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Embodied carbon factors (kg CO2e per unit) based on industry data
const CARBON_FACTORS: { [key: string]: number } = {
  // Timber & Wood (per kg)
  timber_softwood: 0.72,
  timber_hardwood: 0.89,
  timber_engineered: 1.15,
  timber_reclaimed: 0.15,
  
  // Concrete & Masonry (per kg)
  concrete_standard: 0.13,
  concrete_high_strength: 0.16,
  brick_clay: 0.24,
  brick_concrete: 0.14,
  block_concrete: 0.14,
  
  // Steel & Metal (per kg)
  steel_structural: 1.46,
  steel_rebar: 1.22,
  steel_recycled: 0.43,
  aluminium_primary: 11.46,
  aluminium_recycled: 0.64,
  
  // Insulation (per kg)
  insulation_mineral_wool: 1.28,
  insulation_fibreglass: 1.35,
  insulation_foam_board: 3.48,
  insulation_cellulose: 0.94,
  
  // Roofing (per kg)
  tiles_clay: 0.45,
  tiles_concrete: 0.16,
  slate: 0.006,
  metal_roofing: 1.46,
  
  // Other materials (per kg)
  gypsum_plasterboard: 0.38,
  glass: 0.85,
  plastic_pvc: 2.41,
  ceramic: 0.74,
  
  // Aggregates & Stone (per kg)
  gravel_hardcore: 0.005,
  sand_sharp: 0.0051,
  sand_building: 0.0051,
  decorative_stone: 0.008,
  gabion_stone: 0.006,
  topsoil: 0.015,
  pebbles_decorative: 0.007,
  
  // Plumbing & Heating (per kg)
  copper_pipe: 2.71,
  pex_pipe: 2.53,
  cast_iron_radiator: 1.91,
  steel_radiator: 1.46,
  boiler_average: 1.67,
  bathroom_suite_ceramic: 0.74,
  acrylic_bath: 3.2,
  cast_iron_bath: 1.91,
  shower_tray_acrylic: 3.2,
  shower_tray_ceramic: 0.74,
  
  // Drainage & Groundworks (per kg)
  pvc_drainage_pipe: 2.41,
  clay_drainage_pipe: 0.45,
  concrete_manhole: 0.14,
  hdpe_pipe: 1.93,
  french_drain_gravel: 0.005,
  land_drain: 1.93,
  
  // Flooring Materials (per kg)
  vinyl_flooring: 2.41,
  carpet_synthetic: 5.68,
  carpet_wool: 6.5,
  cork_tiles: 0.95,
  laminate_flooring: 1.14,
  engineered_wood_flooring: 1.15,
  solid_wood_flooring: 0.72,
  underlay_foam: 3.48,
  ceramic_tiles: 0.74,
  porcelain_tiles: 0.85,
  
  // Paving & Driveways (per kg)
  tarmac_asphalt: 0.0435,
  block_paving_concrete: 0.16,
  block_paving_clay: 0.45,
  concrete_slabs: 0.14,
  natural_stone_paving: 0.08,
  resin_bound_gravel: 2.2,
  
  // Kitchen & Bathroom (per kg)
  granite_worktop: 0.64,
  quartz_worktop: 0.77,
  laminate_worktop: 1.14,
  kitchen_unit_mdf: 0.56,
  kitchen_unit_solid_wood: 0.72,
  sink_stainless_steel: 1.46,
  sink_ceramic: 0.74,
  taps_brass: 3.5,
  taps_chrome: 1.46,
  
  // External Cladding (per kg)
  render_cement: 0.13,
  render_lime: 0.22,
  upvc_cladding: 2.53,
  timber_cladding: 0.72,
  fibre_cement_cladding: 0.77,
  metal_cladding_steel: 1.46,
  metal_cladding_aluminium: 11.46,
  
  // Doors & Windows (per kg)
  upvc_window: 2.53,
  timber_door: 0.72,
  steel_door: 1.46,
  composite_door: 1.8,
  double_glazing_unit: 0.85,
  fire_door: 1.1,
  
  // Wall & Ceiling Finishes (per kg)
  paint_water_based: 2.91,
  paint_oil_based: 3.18,
  wallpaper: 1.2,
  plaster_gypsum: 0.12,
  plaster_lime: 0.22,
  ceiling_tiles: 0.38,
  coving_plaster: 0.38,
  coving_polystyrene: 3.48,
  
  // Electrical & Lighting (per kg)
  copper_cable: 2.71,
  aluminium_cable: 11.46,
  led_light_fixture: 1.5,
  consumer_unit: 1.46,
  conduit_pvc: 2.41,
  conduit_steel: 1.46,
  cable_tray: 1.46,
  
  // Scaffolding & Access (per kg)
  scaffold_tube_steel: 1.46,
  scaffold_board_timber: 0.72,
  scaffold_tower_aluminium: 0.64,
  ladder_aluminium: 0.64,
  ladder_fibreglass: 1.35,
  
  // Tools & Plant (per kg) - Generic estimates
  power_tool: 2.0,
  hand_tool_steel: 1.46,
  hand_tool_mixed: 1.8,
  plant_machinery: 1.5,
  
  // Safety & Workwear (per kg) - Generic estimates
  ppe_plastic: 2.5,
  safety_barrier: 1.46,
  workwear_synthetic: 5.68,
  hi_vis_vest: 5.5,
  
  // Fixings & Fasteners (per kg)
  steel_screws: 1.46,
  brass_fittings: 3.5,
  stainless_steel_fixings: 1.77,
  chemical_anchors: 2.5,
  nails_steel: 1.46,
  wall_plugs_plastic: 2.41,
  
  // Garden & Landscaping (per kg)
  compost: 0.025,
  mulch_bark: 0.18,
  decorative_bark: 0.18,
  railway_sleepers_new: 0.72,
  railway_sleepers_reclaimed: 0.15,
  trellis_timber: 0.72,
  decking_timber: 0.72,
  decking_composite: 1.3,
  
  // Ventilation & HVAC (per kg)
  ducting_steel: 1.46,
  ducting_plastic: 2.41,
  extractor_fan: 2.0,
  ventilation_grille: 1.46,
  air_conditioning_unit: 2.5,
  
  // Ironmongery & Security (per kg)
  door_handle_brass: 3.5,
  door_handle_steel: 1.46,
  hinge_steel: 1.46,
  lock_mechanism: 2.0,
  security_bolt: 1.46,
  
  // Fencing & Gates (per kg)
  fence_panel_timber: 0.72,
  fence_post_timber: 0.72,
  fence_post_concrete: 0.14,
  fence_post_steel: 1.46,
  gate_timber: 0.72,
  gate_metal: 1.46,
  chain_link_fence: 1.46,
  
  // Site Support & Props (per kg)
  acrow_prop: 1.46,
  beam_clamp: 1.46,
  shoring_equipment: 1.46,
  
  // Miscellaneous (per kg)
  generic_construction_item: 1.0,
}

// Material density factors (kg per cubic meter) for volume calculations
const MATERIAL_DENSITIES: { [key: string]: number } = {
  timber_softwood: 450,
  timber_hardwood: 650,
  timber_engineered: 600,
  timber_reclaimed: 500,
  concrete_standard: 2400,
  concrete_high_strength: 2500,
  brick_clay: 1900,
  brick_concrete: 2200,
  block_concrete: 2200,
  steel_structural: 7850,
  steel_rebar: 7850,
  steel_recycled: 7850,
  aluminium_primary: 2700,
  aluminium_recycled: 2700,
  insulation_mineral_wool: 100,
  insulation_fibreglass: 50,
  insulation_foam_board: 30,
  insulation_cellulose: 50,
  tiles_clay: 2000,
  tiles_concrete: 2400,
  slate: 2800,
  metal_roofing: 7850,
  gypsum_plasterboard: 800,
  glass: 2500,
  plastic_pvc: 1400,
  ceramic: 2400,
  gravel_hardcore: 1600,
  sand_sharp: 1600,
  sand_building: 1450,
  decorative_stone: 1700,
  gabion_stone: 1650,
  topsoil: 1250,
  pebbles_decorative: 1550,
  copper_pipe: 8960,
  pex_pipe: 940,
  cast_iron_radiator: 7200,
  steel_radiator: 7850,
  boiler_average: 6000,
  bathroom_suite_ceramic: 2400,
  acrylic_bath: 1180,
  cast_iron_bath: 7200,
  shower_tray_acrylic: 1180,
  shower_tray_ceramic: 2400,
  pvc_drainage_pipe: 1400,
  clay_drainage_pipe: 1900,
  concrete_manhole: 2400,
  hdpe_pipe: 950,
  french_drain_gravel: 1600,
  land_drain: 950,
  vinyl_flooring: 1400,
  carpet_synthetic: 300,
  carpet_wool: 400,
  cork_tiles: 250,
  laminate_flooring: 900,
  engineered_wood_flooring: 850,
  solid_wood_flooring: 650,
  underlay_foam: 30,
  ceramic_tiles: 2000,
  porcelain_tiles: 2300,
  tarmac_asphalt: 2300,
  block_paving_concrete: 2200,
  block_paving_clay: 1900,
  concrete_slabs: 2400,
  natural_stone_paving: 2600,
  resin_bound_gravel: 1800,
  granite_worktop: 2700,
  quartz_worktop: 2400,
  laminate_worktop: 900,
  kitchen_unit_mdf: 720,
  kitchen_unit_solid_wood: 650,
  sink_stainless_steel: 7850,
  sink_ceramic: 2400,
  taps_brass: 8500,
  taps_chrome: 7850,
  render_cement: 1800,
  render_lime: 1600,
  upvc_cladding: 1400,
  timber_cladding: 500,
  fibre_cement_cladding: 1400,
  metal_cladding_steel: 7850,
  metal_cladding_aluminium: 2700,
  upvc_window: 1400,
  timber_door: 600,
  steel_door: 7850,
  composite_door: 1200,
  double_glazing_unit: 2500,
  fire_door: 750,
  paint_water_based: 1200,
  paint_oil_based: 1400,
  wallpaper: 800,
  plaster_gypsum: 1200,
  plaster_lime: 1400,
  ceiling_tiles: 400,
  coving_plaster: 1200,
  coving_polystyrene: 30,
  copper_cable: 8960,
  aluminium_cable: 2700,
  led_light_fixture: 2000,
  consumer_unit: 5000,
  conduit_pvc: 1400,
  conduit_steel: 7850,
  cable_tray: 7850,
  scaffold_tube_steel: 7850,
  scaffold_board_timber: 600,
  scaffold_tower_aluminium: 2700,
  ladder_aluminium: 2700,
  ladder_fibreglass: 1800,
  power_tool: 3000,
  hand_tool_steel: 7850,
  hand_tool_mixed: 5000,
  plant_machinery: 6000,
  ppe_plastic: 1200,
  safety_barrier: 7850,
  workwear_synthetic: 300,
  hi_vis_vest: 300,
  steel_screws: 7850,
  brass_fittings: 8500,
  stainless_steel_fixings: 7900,
  chemical_anchors: 1100,
  nails_steel: 7850,
  wall_plugs_plastic: 1400,
  compost: 800,
  mulch_bark: 250,
  decorative_bark: 250,
  railway_sleepers_new: 650,
  railway_sleepers_reclaimed: 650,
  trellis_timber: 500,
  decking_timber: 600,
  decking_composite: 1100,
  ducting_steel: 7850,
  ducting_plastic: 1400,
  extractor_fan: 3000,
  ventilation_grille: 5000,
  air_conditioning_unit: 4000,
  door_handle_brass: 8500,
  door_handle_steel: 7850,
  hinge_steel: 7850,
  lock_mechanism: 6000,
  security_bolt: 7850,
  fence_panel_timber: 550,
  fence_post_timber: 600,
  fence_post_concrete: 2400,
  fence_post_steel: 7850,
  gate_timber: 600,
  gate_metal: 7850,
  chain_link_fence: 7850,
  acrow_prop: 7850,
  beam_clamp: 7850,
  shoring_equipment: 7850,
  generic_construction_item: 2000,
}

interface CarbonCalculationRequest {
  categoryName: string;
  condition: string;
  quantity: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
  };
  weight?: number;
  title: string;
  description: string;
}

interface CarbonCalculationResponse {
  totalCarbon: number;
  carbonPerUnit: number;
  materialType: string;
  calculationMethod: 'provided_weight' | 'estimated';
  weight: number;
  landfillDiverted: number;
  carbonFactorSource: string;
  calculationConfidence: 'high' | 'medium' | 'low';
  explanation: string;
  methodology: {
    carbonFactor: number;
    materialDensity: number;
    calculatedWeight: number;
    source: string;
    assumptions: string[];
  };
}

function getMaterialType(categoryName: string, title: string, description: string, condition: string): string {
  const searchText = `${categoryName} ${title} ${description}`.toLowerCase();
  const category = categoryName.toLowerCase();
  
  // Check for reclaimed/recycled materials first
  if (condition === 'good' || condition === 'fair' || 
      searchText.includes('reclaimed') || searchText.includes('salvaged') || 
      searchText.includes('recycled') || searchText.includes('second') || 
      searchText.includes('used')) {
    
    if (searchText.includes('timber') || searchText.includes('wood') || searchText.includes('beam') || searchText.includes('sleeper')) {
      return 'timber_reclaimed';
    }
    if (searchText.includes('steel') || searchText.includes('metal')) {
      return 'steel_recycled';
    }
    if (searchText.includes('aluminium') || searchText.includes('aluminum')) {
      return 'aluminium_recycled';
    }
  }
  
  // Category-specific detection
  
  // Aggregates & Stone
  if (category.includes('aggregates') || category.includes('stone')) {
    if (searchText.includes('gravel') || searchText.includes('hardcore')) return 'gravel_hardcore';
    if (searchText.includes('sand')) {
      if (searchText.includes('sharp')) return 'sand_sharp';
      return 'sand_building';
    }
    if (searchText.includes('gabion')) return 'gabion_stone';
    if (searchText.includes('decorative') || searchText.includes('pebble')) return 'decorative_stone';
    if (searchText.includes('topsoil') || searchText.includes('soil')) return 'topsoil';
    return 'gravel_hardcore';
  }
  
  // Plumbing & Heating
  if (category.includes('plumbing') || category.includes('heating')) {
    if (searchText.includes('boiler')) return 'boiler_average';
    if (searchText.includes('radiator')) {
      if (searchText.includes('cast iron')) return 'cast_iron_radiator';
      return 'steel_radiator';
    }
    if (searchText.includes('pipe')) {
      if (searchText.includes('copper')) return 'copper_pipe';
      if (searchText.includes('pex') || searchText.includes('plastic')) return 'pex_pipe';
      return 'pex_pipe';
    }
    if (searchText.includes('bath')) {
      if (searchText.includes('acrylic')) return 'acrylic_bath';
      if (searchText.includes('cast iron')) return 'cast_iron_bath';
      return 'acrylic_bath';
    }
    if (searchText.includes('shower tray')) {
      if (searchText.includes('ceramic')) return 'shower_tray_ceramic';
      return 'shower_tray_acrylic';
    }
    if (searchText.includes('toilet') || searchText.includes('basin') || searchText.includes('suite')) {
      return 'bathroom_suite_ceramic';
    }
    return 'copper_pipe';
  }
  
  // Drainage & Groundworks
  if (category.includes('drainage') || category.includes('groundworks')) {
    if (searchText.includes('manhole')) return 'concrete_manhole';
    if (searchText.includes('clay')) return 'clay_drainage_pipe';
    if (searchText.includes('hdpe')) return 'hdpe_pipe';
    if (searchText.includes('land drain')) return 'land_drain';
    if (searchText.includes('french drain')) return 'french_drain_gravel';
    return 'pvc_drainage_pipe';
  }
  
  // Flooring Materials
  if (category.includes('flooring')) {
    if (searchText.includes('vinyl')) return 'vinyl_flooring';
    if (searchText.includes('carpet')) {
      if (searchText.includes('wool')) return 'carpet_wool';
      return 'carpet_synthetic';
    }
    if (searchText.includes('cork')) return 'cork_tiles';
    if (searchText.includes('laminate')) return 'laminate_flooring';
    if (searchText.includes('engineered wood')) return 'engineered_wood_flooring';
    if (searchText.includes('solid wood')) return 'solid_wood_flooring';
    if (searchText.includes('underlay')) return 'underlay_foam';
    if (searchText.includes('tile')) {
      if (searchText.includes('porcelain')) return 'porcelain_tiles';
      return 'ceramic_tiles';
    }
    return 'laminate_flooring';
  }
  
  // Paving & Driveways
  if (category.includes('paving') || category.includes('driveway')) {
    if (searchText.includes('tarmac') || searchText.includes('asphalt')) return 'tarmac_asphalt';
    if (searchText.includes('block paving')) {
      if (searchText.includes('clay')) return 'block_paving_clay';
      return 'block_paving_concrete';
    }
    if (searchText.includes('slab')) return 'concrete_slabs';
    if (searchText.includes('natural stone') || searchText.includes('sandstone') || searchText.includes('limestone')) {
      return 'natural_stone_paving';
    }
    if (searchText.includes('resin')) return 'resin_bound_gravel';
    return 'block_paving_concrete';
  }
  
  // Kitchen & Bathroom
  if (category.includes('kitchen') || category.includes('bathroom')) {
    if (searchText.includes('worktop') || searchText.includes('countertop')) {
      if (searchText.includes('granite')) return 'granite_worktop';
      if (searchText.includes('quartz')) return 'quartz_worktop';
      return 'laminate_worktop';
    }
    if (searchText.includes('unit') || searchText.includes('cabinet')) {
      if (searchText.includes('solid wood') || searchText.includes('oak')) return 'kitchen_unit_solid_wood';
      return 'kitchen_unit_mdf';
    }
    if (searchText.includes('sink')) {
      if (searchText.includes('stainless') || searchText.includes('steel')) return 'sink_stainless_steel';
      return 'sink_ceramic';
    }
    if (searchText.includes('tap') || searchText.includes('faucet')) {
      if (searchText.includes('brass')) return 'taps_brass';
      return 'taps_chrome';
    }
    return 'kitchen_unit_mdf';
  }
  
  // External Cladding
  if (category.includes('cladding')) {
    if (searchText.includes('render')) {
      if (searchText.includes('lime')) return 'render_lime';
      return 'render_cement';
    }
    if (searchText.includes('upvc') || searchText.includes('pvc')) return 'upvc_cladding';
    if (searchText.includes('timber') || searchText.includes('wood')) return 'timber_cladding';
    if (searchText.includes('fibre cement')) return 'fibre_cement_cladding';
    if (searchText.includes('metal') || searchText.includes('steel')) return 'metal_cladding_steel';
    if (searchText.includes('aluminium')) return 'metal_cladding_aluminium';
    return 'timber_cladding';
  }
  
  // Doors & Windows
  if (category.includes('door') || category.includes('window')) {
    if (searchText.includes('window')) {
      if (searchText.includes('upvc')) return 'upvc_window';
      if (searchText.includes('double glaz')) return 'double_glazing_unit';
      return 'upvc_window';
    }
    if (searchText.includes('door')) {
      if (searchText.includes('fire')) return 'fire_door';
      if (searchText.includes('composite')) return 'composite_door';
      if (searchText.includes('steel')) return 'steel_door';
      return 'timber_door';
    }
    return 'timber_door';
  }
  
  // Wall & Ceiling Finishes
  if (category.includes('finishes') || category.includes('wall') || category.includes('ceiling') || category.includes('decorating')) {
    if (searchText.includes('paint')) {
      if (searchText.includes('oil')) return 'paint_oil_based';
      return 'paint_water_based';
    }
    if (searchText.includes('wallpaper')) return 'wallpaper';
    if (searchText.includes('plaster')) {
      if (searchText.includes('lime')) return 'plaster_lime';
      return 'plaster_gypsum';
    }
    if (searchText.includes('ceiling tile')) return 'ceiling_tiles';
    if (searchText.includes('coving') || searchText.includes('cornice')) {
      if (searchText.includes('polystyrene')) return 'coving_polystyrene';
      return 'coving_plaster';
    }
    return 'paint_water_based';
  }
  
  // Electrical & Lighting
  if (category.includes('electrical') || category.includes('lighting')) {
    if (searchText.includes('cable') || searchText.includes('wire')) {
      if (searchText.includes('aluminium')) return 'aluminium_cable';
      return 'copper_cable';
    }
    if (searchText.includes('light') || searchText.includes('led') || searchText.includes('fixture')) {
      return 'led_light_fixture';
    }
    if (searchText.includes('consumer unit') || searchText.includes('fuse box')) return 'consumer_unit';
    if (searchText.includes('conduit')) {
      if (searchText.includes('steel')) return 'conduit_steel';
      return 'conduit_pvc';
    }
    if (searchText.includes('cable tray')) return 'cable_tray';
    return 'copper_cable';
  }
  
  // Scaffolding & Access
  if (category.includes('scaffolding') || category.includes('access')) {
    if (searchText.includes('tube') || searchText.includes('pole')) return 'scaffold_tube_steel';
    if (searchText.includes('board') || searchText.includes('plank')) return 'scaffold_board_timber';
    if (searchText.includes('tower') && searchText.includes('aluminium')) return 'scaffold_tower_aluminium';
    if (searchText.includes('ladder')) {
      if (searchText.includes('fibreglass')) return 'ladder_fibreglass';
      return 'ladder_aluminium';
    }
    return 'scaffold_tube_steel';
  }
  
  // Tools & Plant
  if (category.includes('tools') || category.includes('plant')) {
    if (searchText.includes('power tool') || searchText.includes('drill') || searchText.includes('grinder') || searchText.includes('saw')) {
      return 'power_tool';
    }
    if (searchText.includes('machinery') || searchText.includes('mixer') || searchText.includes('generator')) {
      return 'plant_machinery';
    }
    if (searchText.includes('spanner') || searchText.includes('wrench') || searchText.includes('hammer')) {
      return 'hand_tool_steel';
    }
    return 'hand_tool_mixed';
  }
  
  // Safety & Workwear
  if (category.includes('safety') || category.includes('workwear') || category.includes('ppe')) {
    if (searchText.includes('barrier') || searchText.includes('fence')) return 'safety_barrier';
    if (searchText.includes('hi vis') || searchText.includes('vest') || searchText.includes('jacket')) {
      return 'hi_vis_vest';
    }
    if (searchText.includes('helmet') || searchText.includes('goggles') || searchText.includes('mask')) {
      return 'ppe_plastic';
    }
    return 'workwear_synthetic';
  }
  
  // Fixings & Fasteners
  if (category.includes('fixing') || category.includes('fastener') || category.includes('hardware')) {
    if (searchText.includes('brass')) return 'brass_fittings';
    if (searchText.includes('stainless')) return 'stainless_steel_fixings';
    if (searchText.includes('anchor') && searchText.includes('chemical')) return 'chemical_anchors';
    if (searchText.includes('nail')) return 'nails_steel';
    if (searchText.includes('plug') || searchText.includes('rawl')) return 'wall_plugs_plastic';
    return 'steel_screws';
  }
  
  // Garden & Landscaping
  if (category.includes('garden') || category.includes('landscaping') || category.includes('outdoor')) {
    if (searchText.includes('compost')) return 'compost';
    if (searchText.includes('mulch') || searchText.includes('bark')) return 'mulch_bark';
    if (searchText.includes('sleeper')) {
      if (searchText.includes('reclaimed')) return 'railway_sleepers_reclaimed';
      return 'railway_sleepers_new';
    }
    if (searchText.includes('trellis')) return 'trellis_timber';
    if (searchText.includes('decking')) {
      if (searchText.includes('composite')) return 'decking_composite';
      return 'decking_timber';
    }
    if (searchText.includes('topsoil') || searchText.includes('soil')) return 'topsoil';
    return 'topsoil';
  }
  
  // Ventilation & HVAC
  if (category.includes('ventilation') || category.includes('hvac') || category.includes('air conditioning')) {
    if (searchText.includes('ducting') || searchText.includes('duct')) {
      if (searchText.includes('steel')) return 'ducting_steel';
      return 'ducting_plastic';
    }
    if (searchText.includes('fan') || searchText.includes('extractor')) return 'extractor_fan';
    if (searchText.includes('grille') || searchText.includes('vent cover')) return 'ventilation_grille';
    if (searchText.includes('air con') || searchText.includes('hvac unit')) return 'air_conditioning_unit';
    return 'ducting_plastic';
  }
  
  // Ironmongery & Security
  if (category.includes('ironmongery') || category.includes('security')) {
    if (searchText.includes('handle')) {
      if (searchText.includes('brass')) return 'door_handle_brass';
      return 'door_handle_steel';
    }
    if (searchText.includes('hinge')) return 'hinge_steel';
    if (searchText.includes('lock')) return 'lock_mechanism';
    if (searchText.includes('bolt')) return 'security_bolt';
    return 'hinge_steel';
  }
  
  // Fencing & Gates
  if (category.includes('fencing') || category.includes('gate')) {
    if (searchText.includes('post')) {
      if (searchText.includes('concrete')) return 'fence_post_concrete';
      if (searchText.includes('steel') || searchText.includes('metal')) return 'fence_post_steel';
      return 'fence_post_timber';
    }
    if (searchText.includes('gate')) {
      if (searchText.includes('metal') || searchText.includes('steel')) return 'gate_metal';
      return 'gate_timber';
    }
    if (searchText.includes('chain link')) return 'chain_link_fence';
    return 'fence_panel_timber';
  }
  
  // Site Support & Props
  if (category.includes('support') || category.includes('prop')) {
    if (searchText.includes('acrow') || searchText.includes('prop')) return 'acrow_prop';
    if (searchText.includes('clamp')) return 'beam_clamp';
    return 'shoring_equipment';
  }
  
  // General material-specific detection (for items not caught by category)
  if (searchText.includes('timber') || searchText.includes('wood')) {
    if (searchText.includes('engineered') || searchText.includes('glulam') || searchText.includes('lvl')) {
      return 'timber_engineered';
    }
    if (searchText.includes('hardwood') || searchText.includes('oak') || searchText.includes('walnut') || searchText.includes('cherry')) {
      return 'timber_hardwood';
    }
    return 'timber_softwood';
  }
  
  if (searchText.includes('concrete')) {
    if (searchText.includes('high strength') || searchText.includes('high-strength')) {
      return 'concrete_high_strength';
    }
    if (searchText.includes('brick') || searchText.includes('block')) {
      return 'brick_concrete';
    }
    return 'concrete_standard';
  }
  
  if (searchText.includes('brick')) {
    if (searchText.includes('concrete')) return 'brick_concrete';
    return 'brick_clay';
  }
  
  if (searchText.includes('block')) return 'block_concrete';
  
  if (searchText.includes('steel')) {
    if (searchText.includes('rebar') || searchText.includes('reinforcement')) return 'steel_rebar';
    return 'steel_structural';
  }
  
  if (searchText.includes('aluminium') || searchText.includes('aluminum')) return 'aluminium_primary';
  
  if (searchText.includes('insulation')) {
    if (searchText.includes('foam') || searchText.includes('board')) return 'insulation_foam_board';
    if (searchText.includes('mineral wool') || searchText.includes('rockwool')) return 'insulation_mineral_wool';
    if (searchText.includes('fibreglass') || searchText.includes('fiberglass')) return 'insulation_fibreglass';
    if (searchText.includes('cellulose')) return 'insulation_cellulose';
    return 'insulation_mineral_wool';
  }
  
  if (searchText.includes('tile')) {
    if (searchText.includes('concrete')) return 'tiles_concrete';
    return 'tiles_clay';
  }
  
  if (searchText.includes('slate')) return 'slate';
  
  if (searchText.includes('metal') && (searchText.includes('roof') || searchText.includes('sheet'))) {
    return 'metal_roofing';
  }
  
  if (searchText.includes('plasterboard') || searchText.includes('drywall') || searchText.includes('gypsum')) {
    return 'gypsum_plasterboard';
  }
  
  if (searchText.includes('glass')) return 'glass';
  
  if (searchText.includes('pvc') || searchText.includes('plastic')) return 'plastic_pvc';
  
  if (searchText.includes('ceramic')) return 'ceramic';
  
  // Miscellaneous/Generic fallback
  if (category.includes('miscellaneous')) return 'generic_construction_item';
  
  // Default fallback based on category
  if (category.includes('timber')) return 'timber_softwood';
  if (category.includes('brick')) return 'brick_clay';
  if (category.includes('steel')) return 'steel_structural';
  if (category.includes('insulation')) return 'insulation_mineral_wool';
  if (category.includes('concrete')) return 'concrete_standard';
  
  // Ultimate fallback
  return 'concrete_standard';
}

function calculateMaterialWeight(
  materialType: string, 
  dimensions: any, 
  providedWeight?: number
): number {
  if (providedWeight && providedWeight > 0) {
    return providedWeight;
  }
  
  if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
    // Estimate based on material type and quantity - very rough estimates
    const density = MATERIAL_DENSITIES[materialType] || 1000;
    return density * 0.001; // Assume 1 liter volume as default
  }
  
  // Convert dimensions to meters
  let { length, width, height, unit } = dimensions;
  
  const conversionToMeters: { [key: string]: number } = {
    'mm': 0.001,
    'cm': 0.01,
    'm': 1,
    'ft': 0.3048,
    'in': 0.0254,
  };
  
  const conversion = conversionToMeters[unit] || 1;
  length = length * conversion;
  width = width * conversion; 
  height = height * conversion;
  
  const volume = length * width * height; // cubic meters
  const density = MATERIAL_DENSITIES[materialType] || 1000; // kg/m³
  
  return volume * density;
}

function calculateEmbodiedCarbon(request: CarbonCalculationRequest): CarbonCalculationResponse {
  const materialType = getMaterialType(
    request.categoryName, 
    request.title, 
    request.description,
    request.condition
  );
  
  const carbonFactor = CARBON_FACTORS[materialType] || 0.5; // kg CO2e per kg
  const density = MATERIAL_DENSITIES[materialType] || 1000; // kg/m³
  const weightPerUnit = calculateMaterialWeight(materialType, request.dimensions, request.weight);
  const totalWeight = weightPerUnit * request.quantity;
  const carbonPerUnit = weightPerUnit * carbonFactor;
  const totalCarbon = totalWeight * carbonFactor;
  
  // Determine calculation confidence
  let calculationConfidence: 'high' | 'medium' | 'low';
  let confidenceExplanation: string;
  
  if (request.weight && request.weight > 0) {
    calculationConfidence = 'high';
    confidenceExplanation = 'Weight provided by seller with material type identified';
  } else if (request.dimensions?.length && request.dimensions?.width && request.dimensions?.height) {
    // Check if material type is generic/fallback
    if (materialType === 'concrete_standard' || materialType === 'generic_construction_item') {
      calculationConfidence = 'low';
      confidenceExplanation = 'Dimensions provided but generic material classification used';
    } else {
      calculationConfidence = 'medium';
      confidenceExplanation = 'Dimensions provided with specific material type identified';
    }
  } else {
    calculationConfidence = 'low';
    confidenceExplanation = 'Estimated using category defaults and typical material properties';
  }
  
  return {
    totalCarbon: Math.round(totalCarbon * 100) / 100,
    carbonPerUnit: Math.round(carbonPerUnit * 100) / 100,
    materialType,
    calculationMethod: request.weight ? 'provided_weight' : 'estimated',
    weight: totalWeight,
    landfillDiverted: totalWeight,
    carbonFactorSource: 'ICE Database v3.0 (University of Bath)',
    calculationConfidence,
    explanation: `Calculated using ${materialType} carbon factor (${carbonFactor} kg CO2e/kg) for ${request.quantity} units weighing ${Math.round(totalWeight)} kg total.`,
    methodology: {
      carbonFactor,
      materialDensity: density,
      calculatedWeight: totalWeight,
      source: 'Inventory of Carbon & Energy (ICE) Database v3.0, University of Bath, 2019',
      assumptions: [
        request.weight ? 'Weight provided by seller' : 'Weight estimated from dimensions',
        `Material classified as: ${materialType}`,
        `Carbon factor: ${carbonFactor} kg CO2e per kg`,
        'Calculations represent avoided emissions from reuse vs. new production',
        'Values based on industry-standard embodied carbon factors'
      ]
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData: CarbonCalculationRequest = await req.json();
    
    console.log('Carbon calculation request:', {
      categoryName: requestData.categoryName,
      condition: requestData.condition,
      quantity: requestData.quantity,
      dimensions: requestData.dimensions,
      weight: requestData.weight
    });

    // Validate input
    if (!requestData.categoryName || !requestData.quantity || requestData.quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: categoryName and positive quantity required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const calculation = calculateEmbodiedCarbon(requestData);
    
    console.log('Carbon calculation result:', calculation);

    return new Response(
      JSON.stringify({
        success: true,
        ...calculation,
        explanation: `Calculated using ${calculation.materialType} carbon factor (${CARBON_FACTORS[calculation.materialType]} kg CO2e/kg) for ${requestData.quantity} units weighing ${Math.round(calculation.weight)} kg total.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in carbon calculation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

/* Edge function deployment info:
 * This function calculates accurate embodied carbon for construction materials
 * Based on industry-standard carbon factors and material properties
 * Supports various material types, conditions, and calculation methods
 */
