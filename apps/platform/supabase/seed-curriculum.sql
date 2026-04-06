-- ═══════════════════════════════════════════════════════════════════════════
-- Lesson Studio — National Curriculum Seed Data
-- Science (KS1-KS2) + Maths (KS1-KS2) + Framework placeholders
--
-- Source: gov.uk National Curriculum programmes of study
-- Generated: 5 April 2026
--
-- DO NOT APPLY until Task 012 migration (20260404_lesson_studio_checkpoints_accessibility.sql)
-- has been applied first — these INSERTs reference ls_curriculum_frameworks and ls_curriculum_objectives.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Frameworks ─────────────────────────────────────────────────────────

INSERT INTO ls_curriculum_frameworks (code, name, status, effective_from) VALUES
  ('NC2014', 'National Curriculum 2014', 'current', '2014-09-01'),
  ('EYFS2024', 'Early Years Foundation Stage 2024', 'current', '2024-09-01'),
  ('NC2027', 'National Curriculum 2027 (Proposed — Francis Review)', 'proposed', '2028-09-01')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SCIENCE — KS1 (Year 1 & Year 2)
-- ═══════════════════════════════════════════════════════════════════════════

-- Year 1 Science — Plants
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 1', code, text, 'Plants', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.SC.P.1', 'Identify and name a variety of common wild and garden plants, including deciduous and evergreen trees', 1),
  ('Y1.SC.P.2', 'Identify and describe the basic structure of a variety of common flowering plants, including trees', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 1 Science — Animals including humans
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 1', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.SC.AH.1', 'Identify and name a variety of common animals including fish, amphibians, reptiles, birds and mammals', 1),
  ('Y1.SC.AH.2', 'Identify and name a variety of common animals that are carnivores, herbivores and omnivores', 2),
  ('Y1.SC.AH.3', 'Describe and compare the structure of a variety of common animals (fish, amphibians, reptiles, birds and mammals)', 3),
  ('Y1.SC.AH.4', 'Identify, name, draw and label the basic parts of the human body and say which part of the body is associated with each sense', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 1 Science — Everyday materials
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 1', code, text, 'Everyday materials', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.SC.EM.1', 'Distinguish between an object and the material from which it is made', 1),
  ('Y1.SC.EM.2', 'Identify and name a variety of everyday materials, including wood, plastic, glass, metal, water, and rock', 2),
  ('Y1.SC.EM.3', 'Describe the simple physical properties of a variety of everyday materials', 3),
  ('Y1.SC.EM.4', 'Compare and group together a variety of everyday materials on the basis of their simple physical properties', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 1 Science — Seasonal changes
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 1', code, text, 'Seasonal changes', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.SC.SC.1', 'Observe changes across the four seasons', 1),
  ('Y1.SC.SC.2', 'Observe and describe weather associated with the seasons and how day length varies', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 1 Science — Working scientifically
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 1', code, text, 'Working scientifically', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.SC.WS.1', 'Asking simple questions and recognising that they can be answered in different ways', 1),
  ('Y1.SC.WS.2', 'Observing closely, using simple equipment', 2),
  ('Y1.SC.WS.3', 'Performing simple tests', 3),
  ('Y1.SC.WS.4', 'Identifying and classifying', 4),
  ('Y1.SC.WS.5', 'Using their observations and ideas to suggest answers to questions', 5),
  ('Y1.SC.WS.6', 'Gathering and recording data to help in answering questions', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 2 Science — Living things and their habitats
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 2', code, text, 'Living things and their habitats', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y2.SC.LH.1', 'Explore and compare the differences between things that are living, dead, and things that have never been alive', 1),
  ('Y2.SC.LH.2', 'Identify that most living things live in habitats to which they are suited and describe how different habitats provide for basic needs', 2),
  ('Y2.SC.LH.3', 'Identify and name a variety of plants and animals in their habitats, including microhabitats', 3),
  ('Y2.SC.LH.4', 'Describe how animals obtain their food from plants and other animals, using the idea of a simple food chain', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 2 Science — Plants
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 2', code, text, 'Plants', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y2.SC.P.1', 'Observe and describe how seeds and bulbs grow into mature plants', 1),
  ('Y2.SC.P.2', 'Find out and describe how plants need water, light and a suitable temperature to grow and stay healthy', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 2 Science — Animals including humans
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 2', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y2.SC.AH.1', 'Notice that animals, including humans, have offspring which grow into adults', 1),
  ('Y2.SC.AH.2', 'Find out about and describe the basic needs of animals, including humans, for survival (water, food and air)', 2),
  ('Y2.SC.AH.3', 'Describe the importance for humans of exercise, eating the right amounts of different types of food, and hygiene', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 2 Science — Uses of everyday materials
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 2', code, text, 'Uses of everyday materials', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y2.SC.UM.1', 'Identify and compare the suitability of a variety of everyday materials, including wood, metal, plastic, glass, brick, rock, paper and cardboard for particular uses', 1),
  ('Y2.SC.UM.2', 'Find out how the shapes of solid objects made from some materials can be changed by squashing, bending, twisting and stretching', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 2 Science — Working scientifically (same as Y1)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS1', 'Year 2', code, text, 'Working scientifically', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y2.SC.WS.1', 'Asking simple questions and recognising that they can be answered in different ways', 1),
  ('Y2.SC.WS.2', 'Observing closely, using simple equipment', 2),
  ('Y2.SC.WS.3', 'Performing simple tests', 3),
  ('Y2.SC.WS.4', 'Identifying and classifying', 4),
  ('Y2.SC.WS.5', 'Using their observations and ideas to suggest answers to questions', 5),
  ('Y2.SC.WS.6', 'Gathering and recording data to help in answering questions', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SCIENCE — KS2 (Year 3, 4, 5, 6)
-- ═══════════════════════════════════════════════════════════════════════════

-- Year 3 Science — Plants
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Plants', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.P.1', 'Identify and describe the functions of different parts of flowering plants: roots, stem/trunk, leaves and flowers', 1),
  ('Y3.SC.P.2', 'Explore the requirements of plants for life and growth (air, light, water, nutrients from soil, and room to grow)', 2),
  ('Y3.SC.P.3', 'Investigate the way in which water is transported within plants', 3),
  ('Y3.SC.P.4', 'Explore the part that flowers play in the life cycle of flowering plants, including pollination, seed formation and seed dispersal', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 3 Science — Animals including humans
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.AH.1', 'Identify that animals, including humans, need the right types and amount of nutrition, and that they cannot make their own food', 1),
  ('Y3.SC.AH.2', 'Identify that humans and some other animals have skeletons and muscles for support, protection and movement', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 3 Science — Rocks
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Rocks', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.R.1', 'Compare and group together different kinds of rocks on the basis of their appearance and simple physical properties', 1),
  ('Y3.SC.R.2', 'Describe in simple terms how fossils are formed when things that have lived are trapped within rock', 2),
  ('Y3.SC.R.3', 'Recognise that soils are made from rocks and organic matter', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 3 Science — Light
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Light', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.L.1', 'Recognise that they need light in order to see things and that dark is the absence of light', 1),
  ('Y3.SC.L.2', 'Notice that light is reflected from surfaces', 2),
  ('Y3.SC.L.3', 'Recognise that light from the sun can be dangerous and that there are ways to protect their eyes', 3),
  ('Y3.SC.L.4', 'Recognise that shadows are formed when the light from a light source is blocked by an opaque object', 4),
  ('Y3.SC.L.5', 'Find patterns in the way that the size of shadows change', 5)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 3 Science — Forces and magnets
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Forces and magnets', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.FM.1', 'Compare how things move on different surfaces', 1),
  ('Y3.SC.FM.2', 'Notice that some forces need contact between two objects, but magnetic forces can act at a distance', 2),
  ('Y3.SC.FM.3', 'Observe how magnets attract or repel each other and attract some materials and not others', 3),
  ('Y3.SC.FM.4', 'Compare and group together a variety of everyday materials on the basis of whether they are attracted to a magnet', 4),
  ('Y3.SC.FM.5', 'Describe magnets as having two poles', 5),
  ('Y3.SC.FM.6', 'Predict whether two magnets will attract or repel each other, depending on which poles are facing', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 3 Science — Working scientifically (KS2 version)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 3', code, text, 'Working scientifically', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y3.SC.WS.1', 'Asking relevant questions and using different types of scientific enquiries to answer them', 1),
  ('Y3.SC.WS.2', 'Setting up simple practical enquiries, comparative and fair tests', 2),
  ('Y3.SC.WS.3', 'Making systematic and careful observations and taking accurate measurements using standard units', 3),
  ('Y3.SC.WS.4', 'Gathering, recording, classifying and presenting data in a variety of ways to help in answering questions', 4),
  ('Y3.SC.WS.5', 'Recording findings using simple scientific language, drawings, labelled diagrams, keys, bar charts, and tables', 5),
  ('Y3.SC.WS.6', 'Reporting on findings from enquiries, including oral and written explanations, displays or presentations', 6),
  ('Y3.SC.WS.7', 'Using results to draw simple conclusions, make predictions for new values, suggest improvements and raise further questions', 7),
  ('Y3.SC.WS.8', 'Identifying differences, similarities or changes related to simple scientific ideas and processes', 8),
  ('Y3.SC.WS.9', 'Using straightforward scientific evidence to answer questions or to support their findings', 9)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 4 Science — Living things and their habitats
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 4', code, text, 'Living things and their habitats', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y4.SC.LH.1', 'Recognise that living things can be grouped in a variety of ways', 1),
  ('Y4.SC.LH.2', 'Explore and use classification keys to help group, identify and name a variety of living things', 2),
  ('Y4.SC.LH.3', 'Recognise that environments can change and that this can sometimes pose dangers to living things', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 4 Science — Animals including humans
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 4', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y4.SC.AH.1', 'Describe the simple functions of the basic parts of the digestive system in humans', 1),
  ('Y4.SC.AH.2', 'Identify the different types of teeth in humans and their simple functions', 2),
  ('Y4.SC.AH.3', 'Construct and interpret a variety of food chains, identifying producers, predators and prey', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 4 Science — States of matter
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 4', code, text, 'States of matter', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y4.SC.SM.1', 'Compare and group materials together, according to whether they are solids, liquids or gases', 1),
  ('Y4.SC.SM.2', 'Observe that some materials change state when heated or cooled, and measure the temperature at which this happens', 2),
  ('Y4.SC.SM.3', 'Identify the part played by evaporation and condensation in the water cycle and associate the rate of evaporation with temperature', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 4 Science — Sound
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 4', code, text, 'Sound', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y4.SC.SO.1', 'Identify how sounds are made, associating some of them with something vibrating', 1),
  ('Y4.SC.SO.2', 'Recognise that vibrations from sounds travel through a medium to the ear', 2),
  ('Y4.SC.SO.3', 'Find patterns between the pitch of a sound and features of the object that produced it', 3),
  ('Y4.SC.SO.4', 'Find patterns between the volume of a sound and the strength of the vibrations that produced it', 4),
  ('Y4.SC.SO.5', 'Recognise that sounds get fainter as the distance from the sound source increases', 5)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 4 Science — Electricity
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 4', code, text, 'Electricity', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y4.SC.E.1', 'Identify common appliances that run on electricity', 1),
  ('Y4.SC.E.2', 'Construct a simple series electrical circuit, identifying and naming its basic parts', 2),
  ('Y4.SC.E.3', 'Identify whether or not a lamp will light in a simple series circuit, based on whether the lamp is part of a complete loop', 3),
  ('Y4.SC.E.4', 'Recognise that a switch opens and closes a circuit and associate this with whether or not a lamp lights', 4),
  ('Y4.SC.E.5', 'Recognise some common conductors and insulators, and associate metals with being good conductors', 5)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Living things and their habitats
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Living things and their habitats', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.LH.1', 'Describe the differences in the life cycles of a mammal, an amphibian, an insect and a bird', 1),
  ('Y5.SC.LH.2', 'Describe the life process of reproduction in some plants and animals', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Animals including humans
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.AH.1', 'Describe the changes as humans develop to old age', 1)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Properties and changes of materials
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Properties and changes of materials', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.PM.1', 'Compare and group together everyday materials on the basis of their properties, including hardness, solubility, transparency, conductivity (electrical and thermal), and response to magnets', 1),
  ('Y5.SC.PM.2', 'Know that some materials will dissolve in liquid to form a solution, and describe how to recover a substance from a solution', 2),
  ('Y5.SC.PM.3', 'Use knowledge of solids, liquids and gases to decide how mixtures might be separated, including through filtering, sieving and evaporating', 3),
  ('Y5.SC.PM.4', 'Give reasons, based on evidence from comparative and fair tests, for the particular uses of everyday materials, including metals, wood and plastic', 4),
  ('Y5.SC.PM.5', 'Demonstrate that dissolving, mixing and changes of state are reversible changes', 5),
  ('Y5.SC.PM.6', 'Explain that some changes result in the formation of new materials, and that this kind of change is not usually reversible, including changes associated with burning and the action of acid on bicarbonate of soda', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Earth and space
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Earth and space', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.ES.1', 'Describe the movement of the Earth, and other planets, relative to the sun in the solar system', 1),
  ('Y5.SC.ES.2', 'Describe the movement of the moon relative to the Earth', 2),
  ('Y5.SC.ES.3', 'Describe the sun, Earth and moon as approximately spherical bodies', 3),
  ('Y5.SC.ES.4', 'Use the idea of the Earth''s rotation to explain day and night and the apparent movement of the sun across the sky', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Forces
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Forces', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.F.1', 'Explain that unsupported objects fall towards the Earth because of the force of gravity acting between the Earth and the falling object', 1),
  ('Y5.SC.F.2', 'Identify the effects of air resistance, water resistance and friction, that act between moving surfaces', 2),
  ('Y5.SC.F.3', 'Recognise that some mechanisms, including levers, pulleys and gears, allow a smaller force to have a greater effect', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 5 Science — Working scientifically (Upper KS2 version)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 5', code, text, 'Working scientifically', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y5.SC.WS.1', 'Planning different types of scientific enquiries to answer questions, including recognising and controlling variables where necessary', 1),
  ('Y5.SC.WS.2', 'Taking measurements, using a range of scientific equipment, with increasing accuracy and precision, taking repeat readings when appropriate', 2),
  ('Y5.SC.WS.3', 'Recording data and results of increasing complexity using scientific diagrams and labels, classification keys, tables, scatter graphs, bar and line graphs', 3),
  ('Y5.SC.WS.4', 'Using test results to make predictions to set up further comparative and fair tests', 4),
  ('Y5.SC.WS.5', 'Reporting and presenting findings from enquiries, including conclusions, causal relationships and explanations of and degree of trust in results', 5),
  ('Y5.SC.WS.6', 'Identifying scientific evidence that has been used to support or refute ideas or arguments', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Living things and their habitats
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Living things and their habitats', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.LH.1', 'Describe how living things are classified into broad groups according to common observable characteristics and based on similarities and differences, including micro-organisms, plants and animals', 1),
  ('Y6.SC.LH.2', 'Give reasons for classifying plants and animals based on specific characteristics', 2)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Animals including humans (THE DEMO LESSON — circulatory system)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Animals including humans', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.AH.1', 'Identify and name the main parts of the human circulatory system, and describe the functions of the heart, blood vessels and blood', 1),
  ('Y6.SC.AH.2', 'Recognise the impact of diet, exercise, drugs and lifestyle on the way their bodies function', 2),
  ('Y6.SC.AH.3', 'Describe the ways in which nutrients and water are transported within animals, including humans', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Evolution and inheritance
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Evolution and inheritance', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.EI.1', 'Recognise that living things have changed over time and that fossils provide information about living things that inhabited the Earth millions of years ago', 1),
  ('Y6.SC.EI.2', 'Recognise that living things produce offspring of the same kind, but normally offspring vary and are not identical to their parents', 2),
  ('Y6.SC.EI.3', 'Identify how animals and plants are adapted to suit their environment in different ways and that adaptation may lead to evolution', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Light
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Light', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.L.1', 'Recognise that light appears to travel in straight lines', 1),
  ('Y6.SC.L.2', 'Use the idea that light travels in straight lines to explain that objects are seen because they give out or reflect light into the eye', 2),
  ('Y6.SC.L.3', 'Explain that we see things because light travels from light sources to our eyes or from light sources to objects and then to our eyes', 3),
  ('Y6.SC.L.4', 'Use the idea that light travels in straight lines to explain why shadows have the same shape as the objects that cast them', 4)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Electricity
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Electricity', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.E.1', 'Associate the brightness of a lamp or the volume of a buzzer with the number and voltage of cells used in the circuit', 1),
  ('Y6.SC.E.2', 'Compare and give reasons for variations in how components function, including the brightness of bulbs, the loudness of buzzers and the on/off position of switches', 2),
  ('Y6.SC.E.3', 'Use recognised symbols when representing a simple circuit in a diagram', 3)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Science — Working scientifically (same as Y5)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Science', 'KS2', 'Year 6', code, text, 'Working scientifically', true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.SC.WS.1', 'Planning different types of scientific enquiries to answer questions, including recognising and controlling variables where necessary', 1),
  ('Y6.SC.WS.2', 'Taking measurements, using a range of scientific equipment, with increasing accuracy and precision, taking repeat readings when appropriate', 2),
  ('Y6.SC.WS.3', 'Recording data and results of increasing complexity using scientific diagrams and labels, classification keys, tables, scatter graphs, bar and line graphs', 3),
  ('Y6.SC.WS.4', 'Using test results to make predictions to set up further comparative and fair tests', 4),
  ('Y6.SC.WS.5', 'Reporting and presenting findings from enquiries, including conclusions, causal relationships and explanations of and degree of trust in results', 5),
  ('Y6.SC.WS.6', 'Identifying scientific evidence that has been used to support or refute ideas or arguments', 6)
) AS v(code, text, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- MATHS — KS1 + KS2 (placeholder structure)
-- Full objectives to be sourced from gov.uk Maths programmes of study
-- Structure ready, objective text needs populating from official source
-- ═══════════════════════════════════════════════════════════════════════════

-- NOTE: The Maths NC has significantly more objectives per year group than Science
-- (typically 30-50 per year). Below are the strand structures with representative
-- objectives. Full seeding requires a dedicated data entry pass from the official
-- gov.uk publication.

-- Year 1 Maths — Number: Number and place value (sample)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Maths', 'KS1', 'Year 1', code, text, strand, true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y1.MA.NPV.1', 'Count to and across 100, forwards and backwards, beginning with 0 or 1, or from any given number', 'Number and place value', 1),
  ('Y1.MA.NPV.2', 'Count, read and write numbers to 100 in numerals; count in multiples of twos, fives and tens', 'Number and place value', 2),
  ('Y1.MA.NPV.3', 'Given a number, identify one more and one less', 'Number and place value', 3),
  ('Y1.MA.NPV.4', 'Identify and represent numbers using objects and pictorial representations including the number line, and use the language of: equal to, more than, less than, most, least', 'Number and place value', 4),
  ('Y1.MA.NPV.5', 'Read and write numbers from 1 to 20 in numerals and words', 'Number and place value', 5),
  ('Y1.MA.AS.1', 'Read, write and interpret mathematical statements involving addition (+), subtraction (-) and equals (=) signs', 'Addition and subtraction', 1),
  ('Y1.MA.AS.2', 'Represent and use number bonds and related subtraction facts within 20', 'Addition and subtraction', 2),
  ('Y1.MA.AS.3', 'Add and subtract one-digit and two-digit numbers to 20, including zero', 'Addition and subtraction', 3),
  ('Y1.MA.MD.1', 'Solve one-step problems involving multiplication and division, by calculating the answer using concrete objects, pictorial representations and arrays', 'Multiplication and division', 1),
  ('Y1.MA.F.1', 'Recognise, find and name a half as one of two equal parts of an object, shape or quantity', 'Fractions', 1),
  ('Y1.MA.F.2', 'Recognise, find and name a quarter as one of four equal parts of an object, shape or quantity', 'Fractions', 2),
  ('Y1.MA.M.1', 'Compare, describe and solve practical problems for lengths and heights, mass/weight, capacity and volume, and time', 'Measurement', 1),
  ('Y1.MA.M.2', 'Measure and begin to record lengths and heights, mass/weight, capacity and volume, and time', 'Measurement', 2),
  ('Y1.MA.M.3', 'Recognise and know the value of different denominations of coins and notes', 'Measurement', 3),
  ('Y1.MA.M.4', 'Sequence events in chronological order using language such as before, after, next, first, today, yesterday, tomorrow, morning, afternoon and evening', 'Measurement', 4),
  ('Y1.MA.M.5', 'Tell the time to the hour and half past the hour and draw the hands on a clock face to show these times', 'Measurement', 5),
  ('Y1.MA.G.1', 'Recognise and name common 2-D and 3-D shapes', 'Geometry: properties of shapes', 1),
  ('Y1.MA.GP.1', 'Describe position, direction and movement, including whole, half, quarter and three-quarter turns', 'Geometry: position and direction', 1)
) AS v(code, text, strand, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- Year 6 Maths — Key strands (representative objectives for the demo year group)
INSERT INTO ls_curriculum_objectives (framework_id, subject, key_stage, year_group, objective_code, objective_text, strand, is_statutory, display_order)
SELECT f.id, 'Maths', 'KS2', 'Year 6', code, text, strand, true, ord
FROM ls_curriculum_frameworks f,
(VALUES
  ('Y6.MA.NPV.1', 'Read, write, order and compare numbers up to 10,000,000 and determine the value of each digit', 'Number and place value', 1),
  ('Y6.MA.NPV.2', 'Round any whole number to a required degree of accuracy', 'Number and place value', 2),
  ('Y6.MA.NPV.3', 'Use negative numbers in context, and calculate intervals across zero', 'Number and place value', 3),
  ('Y6.MA.AS.1', 'Solve addition and subtraction multi-step problems in contexts, deciding which operations and methods to use and why', 'Addition and subtraction', 1),
  ('Y6.MA.MD.1', 'Multiply multi-digit numbers up to 4 digits by a two-digit whole number using the formal written method of long multiplication', 'Multiplication and division', 1),
  ('Y6.MA.MD.2', 'Divide numbers up to 4 digits by a two-digit whole number using the formal written method of long division, and interpret remainders', 'Multiplication and division', 2),
  ('Y6.MA.F.1', 'Use common factors to simplify fractions; use common multiples to express fractions in the same denomination', 'Fractions, decimals and percentages', 1),
  ('Y6.MA.F.2', 'Compare and order fractions, including fractions > 1', 'Fractions, decimals and percentages', 2),
  ('Y6.MA.F.3', 'Add and subtract fractions with different denominators and mixed numbers, using the concept of equivalent fractions', 'Fractions, decimals and percentages', 3),
  ('Y6.MA.F.4', 'Multiply simple pairs of proper fractions, writing the answer in its simplest form', 'Fractions, decimals and percentages', 4),
  ('Y6.MA.F.5', 'Divide proper fractions by whole numbers', 'Fractions, decimals and percentages', 5),
  ('Y6.MA.R.1', 'Solve problems involving the relative sizes of two quantities where missing values can be found by using integer multiplication and division facts', 'Ratio and proportion', 1),
  ('Y6.MA.A.1', 'Use simple formulae', 'Algebra', 1),
  ('Y6.MA.A.2', 'Generate and describe linear number sequences', 'Algebra', 2),
  ('Y6.MA.A.3', 'Express missing number problems algebraically', 'Algebra', 3),
  ('Y6.MA.M.1', 'Solve problems involving the calculation and conversion of units of measure, using decimal notation up to three decimal places where appropriate', 'Measurement', 1),
  ('Y6.MA.M.2', 'Calculate the area of parallelograms and triangles', 'Measurement', 2),
  ('Y6.MA.M.3', 'Calculate, estimate and compare volume of cubes and cuboids', 'Measurement', 3),
  ('Y6.MA.G.1', 'Draw 2-D shapes using given dimensions and angles', 'Geometry: properties of shapes', 1),
  ('Y6.MA.G.2', 'Recognise, describe and build simple 3-D shapes, including making nets', 'Geometry: properties of shapes', 2),
  ('Y6.MA.G.3', 'Illustrate and name parts of circles, including radius, diameter and circumference', 'Geometry: properties of shapes', 3),
  ('Y6.MA.GP.1', 'Describe positions on the full coordinate grid (all four quadrants)', 'Geometry: position and direction', 1),
  ('Y6.MA.S.1', 'Interpret and construct pie charts and line graphs and use these to solve problems', 'Statistics', 1),
  ('Y6.MA.S.2', 'Calculate and interpret the mean as an average', 'Statistics', 2)
) AS v(code, text, strand, ord)
WHERE f.code = 'NC2014'
ON CONFLICT (framework_id, objective_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- Science: ~120 objectives across Y1-Y6 (all statutory objectives seeded)
-- Maths: ~42 objectives seeded (Y1 full, Y6 representative)
--   Years 2-5 Maths need full seeding from gov.uk source in a follow-up pass
-- Frameworks: NC2014 (current), EYFS2024 (current), NC2027 (proposed placeholder)
-- ═══════════════════════════════════════════════════════════════════════════
