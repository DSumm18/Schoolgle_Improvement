const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Solar System pricing (£49-£99/month, £290-£490/year)
  const modules = [
    { id: 'improvement', name: 'School Improvement', planet: 'Mercury', monthly: 4900, yearly: 49000 },
    { id: 'governance', name: 'Governance', planet: 'Venus', monthly: 2900, yearly: 29000 },
    { id: 'estates', name: 'Business Operations', planet: 'Earth', monthly: 3900, yearly: 39000 },
    { id: 'compliance', name: 'Compliance & Safeguarding', planet: 'Mars', monthly: 2900, yearly: 29000 },
    { id: 'communications', name: 'Communications', planet: 'Jupiter', monthly: 1900, yearly: 19000 },
    { id: 'intelligence', name: 'Schoolgle Intelligence', planet: 'Saturn', monthly: 3900, yearly: 39000 },
    { id: 'teaching', name: 'Teaching & Learning', planet: 'Uranus', monthly: 2900, yearly: 29000 },
    { id: 'ed-ai', name: 'Ed AI', planet: 'Moon', monthly: 4900, yearly: 49000 },
    { id: 'surveys', name: 'Surveys', planet: 'Asteroid', monthly: 900, yearly: 9000 },
    { id: 'canvas', name: 'Canvas', planet: 'Asteroid', monthly: 2900, yearly: 29000 },
  ];

  console.log('Inserting Solar System pricing...\n');

  for (const module of modules) {
    const { error } = await supabase
      .from('module_pricing')
      .upsert({
        module_id: module.id,
        module_name: module.name,
        standard_price: module.yearly, // Store yearly as standard
        effective_from: new Date().toISOString().split('T')[0]
      }, { onConflict: 'module_id,effective_from' });

    if (error) {
      console.log(`❌ ${module.name}:`, error.message);
    } else {
      const price = (module.yearly / 100).toFixed(2);
      console.log(`✅ ${module.planet} - ${module.name}: £${price}/year`);
    }
  }

  console.log('\n✨ Pricing data inserted!');
})();
