import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Embodied carbon factors (kg CO2e per unit) based on industry data
const CARBON_FACTORS: { [key: string]: number } = {
  // Timber & Wood (per kg)
  timber_softwood: 0.72,  // Softwood lumber
  timber_hardwood: 0.89,  // Hardwood lumber  
  timber_engineered: 1.15, // Engineered wood products
  timber_reclaimed: 0.15,  // Reclaimed wood (much lower due to avoided new production)
  
  // Concrete & Masonry (per kg)
  concrete_standard: 0.13,  // Standard concrete
  concrete_high_strength: 0.16, // High strength concrete
  brick_clay: 0.24,        // Clay bricks
  brick_concrete: 0.14,    // Concrete bricks/blocks
  block_concrete: 0.14,    // Concrete blocks
  
  // Steel & Metal (per kg)  
  steel_structural: 1.46,  // Structural steel
  steel_rebar: 1.22,       // Reinforcement steel
  steel_recycled: 0.43,    // Recycled steel content
  aluminium_primary: 11.46, // Primary aluminium
  aluminium_recycled: 0.64, // Recycled aluminium
  
  // Insulation (per kg)
  insulation_mineral_wool: 1.28, // Mineral wool
  insulation_fibreglass: 1.35,   // Fibreglass
  insulation_foam_board: 3.48,   // Foam board insulation
  insulation_cellulose: 0.94,    // Cellulose insulation
  
  // Roofing (per kg)
  tiles_clay: 0.45,        // Clay tiles
  tiles_concrete: 0.16,    // Concrete tiles
  slate: 0.006,           // Natural slate
  metal_roofing: 1.46,    // Metal roofing
  
  // Other materials (per kg)
  gypsum_plasterboard: 0.38, // Plasterboard/drywall
  glass: 0.85,            // Standard glass
  plastic_pvc: 2.41,      // PVC products
  ceramic: 0.74,          // Ceramic products
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
  
  // Check for reclaimed/recycled materials first
  if (condition === 'good' || condition === 'fair' || 
      searchText.includes('reclaimed') || searchText.includes('salvaged') || 
      searchText.includes('recycled') || searchText.includes('second') || 
      searchText.includes('used')) {
    
    if (searchText.includes('timber') || searchText.includes('wood') || searchText.includes('beam')) {
      return 'timber_reclaimed';
    }
    if (searchText.includes('steel') || searchText.includes('metal')) {
      return 'steel_recycled';
    }
    if (searchText.includes('aluminium') || searchText.includes('aluminum')) {
      return 'aluminium_recycled';
    }
  }
  
  // Material type detection based on category and content
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
    if (searchText.includes('concrete')) {
      return 'brick_concrete';
    }
    return 'brick_clay';
  }
  
  if (searchText.includes('block')) {
    return 'block_concrete';
  }
  
  if (searchText.includes('steel')) {
    if (searchText.includes('rebar') || searchText.includes('reinforcement')) {
      return 'steel_rebar';
    }
    return 'steel_structural';
  }
  
  if (searchText.includes('aluminium') || searchText.includes('aluminum')) {
    return 'aluminium_primary';
  }
  
  if (searchText.includes('insulation')) {
    if (searchText.includes('foam') || searchText.includes('board')) {
      return 'insulation_foam_board';
    }
    if (searchText.includes('mineral wool') || searchText.includes('rockwool')) {
      return 'insulation_mineral_wool';
    }
    if (searchText.includes('fibreglass') || searchText.includes('fiberglass')) {
      return 'insulation_fibreglass';
    }
    if (searchText.includes('cellulose')) {
      return 'insulation_cellulose';
    }
    return 'insulation_mineral_wool'; // default
  }
  
  if (searchText.includes('tile')) {
    if (searchText.includes('concrete')) {
      return 'tiles_concrete';
    }
    return 'tiles_clay';
  }
  
  if (searchText.includes('slate')) {
    return 'slate';
  }
  
  if (searchText.includes('metal') && (searchText.includes('roof') || searchText.includes('sheet'))) {
    return 'metal_roofing';
  }
  
  if (searchText.includes('plasterboard') || searchText.includes('drywall') || searchText.includes('gypsum')) {
    return 'gypsum_plasterboard';
  }
  
  if (searchText.includes('glass')) {
    return 'glass';
  }
  
  if (searchText.includes('pvc') || searchText.includes('plastic')) {
    return 'plastic_pvc';
  }
  
  if (searchText.includes('ceramic')) {
    return 'ceramic';
  }
  
  // Default fallback based on category
  if (categoryName.toLowerCase().includes('timber')) return 'timber_softwood';
  if (categoryName.toLowerCase().includes('brick')) return 'brick_clay';
  if (categoryName.toLowerCase().includes('steel')) return 'steel_structural';
  if (categoryName.toLowerCase().includes('insulation')) return 'insulation_mineral_wool';
  if (categoryName.toLowerCase().includes('concrete')) return 'concrete_standard';
  
  // Generic fallback
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
  if (request.weight) {
    calculationConfidence = 'high';
  } else if (request.dimensions?.length && request.dimensions?.width && request.dimensions?.height) {
    calculationConfidence = 'medium';
  } else {
    calculationConfidence = 'low';
  }
  
  return {
    totalCarbon: Math.round(totalCarbon),
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
