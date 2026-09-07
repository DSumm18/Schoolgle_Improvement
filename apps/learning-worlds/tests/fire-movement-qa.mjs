// Compatibility entry point: the old five isolated movement rectangles were
// replaced by connected exploration. Run the stronger route/interact suite.
if(process.env.FIRE_MOVEMENT_QA_DIR&&!process.env.FIRE_EXPLORATION_QA_DIR)process.env.FIRE_EXPLORATION_QA_DIR=process.env.FIRE_MOVEMENT_QA_DIR;
if(process.env.FIRE_QA_URL&&!process.env.FIRE_EXPLORATION_URL){process.env.FIRE_EXPLORATION_URL=process.env.FIRE_QA_URL;process.env.FIRE_EXPLORATION_PUBLIC??='1';}
console.log('Fire movement QA now includes continuous routes, proximity interactions and learning gates.');
await import('./fire-exploration-qa.mjs');
