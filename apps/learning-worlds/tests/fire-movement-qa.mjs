import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rawURL = process.env.FIRE_QA_URL || 'http://127.0.0.1:4173/?game=fire';
const url = new URL(rawURL); url.searchParams.set('game', 'fire'); url.searchParams.delete('demo');
const dir = process.env.FIRE_MOVEMENT_QA_DIR || 'test-results/fire-movement';
const earnedPath = process.env.FIRE_EARNED_STORAGE || 'C:/Dev/Schoolgle_Improvement/apps/learning-worlds/test-results/investigation-upgrade/fire/alex-earned.json';
fs.mkdirSync(dir, { recursive: true });
const report = { at: new Date().toISOString(), url: url.href, checks: [], observations: [], errors: [], failedResponses: [], limits: ['Isolated desktop Chrome with touch emulation; not a physical tablet or pupil usability study.', 'Completed-station checks reuse an existing genuinely played fictional Alex record; they do not claim a new full journey.', 'Current activities use choice controls, not free-form answers; focus isolation is checked on actual task buttons and the native explorer select.'] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let active;
const contexts = [];
const snap = page => page.evaluate(() => window.__fire.snapshot());
const learning = s => ({ chapter: s.chapter, stage: s.stage, draft: s.draft, completed: s.completed, attempts: s.attempts, gems: s.gems });
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const pass = text => { report.checks.push(text); console.log('PASS', text); };
const wait = (page, ms) => page.waitForTimeout(ms);
function inside(e) {
  assert.ok(e.bounds, 'Explorer exposes walking bounds');
  const [x, y, z] = e.position, b = e.bounds, tolerance = .015;
  assert.ok(x >= b.minX - tolerance && x <= b.maxX + tolerance && z >= b.minZ - tolerance && z <= b.maxZ + tolerance, JSON.stringify({ position: e.position, bounds: b }));
  assert.ok(Math.abs(y - b.y) < tolerance, 'Feet remain on station ground height');
}
async function opened({ width = 1440, reduced = false, earned = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 900 : 1000 }, hasTouch: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  contexts.push(context);
  if (earned) {
    const stored = JSON.parse(fs.readFileSync(earnedPath, 'utf8'));
    const entry = stored.origins.flatMap(o => o.localStorage).find(e => e.name === 'schoolgle-great-fire-v1-demo-alex');
    assert.ok(entry, 'Prior earned Alex record exists');
    const record = JSON.parse(entry.value); assert.equal(record.completed.length, 5); assert.ok(record.attempts.length > 20);
    await context.addInitScript(({ name, value }) => { if (!localStorage.getItem(name)) localStorage.setItem(name, value); }, entry);
    report.earnedRecord = { path: earnedPath, attempts: record.attempts.length, completed: record.completed.length };
  }
  const page = active = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.failedResponses.push(`${r.status()} ${r.url()}`); });
  const target = new URL(url); if (earned) target.searchParams.set('demo', '1');
  await page.goto(target.href); await page.waitForFunction(() => window.__fire?.snapshot().explorer?.loaded, null, { timeout: 60000 });
  if (await page.locator('#fire-start').isVisible()) await page.locator('#fire-start').click();
  await page.waitForFunction(() => __fire.snapshot().explorer.arrived);
  if (reduced) {
    await page.locator('#fire-comfort').click(); await page.locator('#fire-motion').check(); await page.keyboard.press('Escape');
  }
  await page.locator('#fire-walk-focus').click(); await page.locator('#fire-world').focus();
  return { page, context };
}
async function hold(page, key, ms = 600) {
  const before = (await snap(page)).explorer;
  await page.keyboard.down(key); await wait(page, ms);
  const during = (await snap(page)).explorer;
  await page.keyboard.up(key); await wait(page, 100);
  const after = (await snap(page)).explorer;
  inside(during); inside(after);
  return { key, before: before.position, during: during.position, after: after.position, movement: during.movement, action: during.action };
}
async function stopped(page, text) {
  await wait(page, 150); const a = (await snap(page)).explorer; await wait(page, 450); const b = (await snap(page)).explorer;
  assert.ok(distance(a.position, b.position) < .015, text); assert.equal(b.movement.active, false, text); return b;
}
try {
  const { page, context } = await opened();
  if (process.argv.includes('--visual-only')) {
    await wait(page, 1500);
    await page.locator('#fire-world').screenshot({ path: `${dir}/explorer-before.png` });
    const before = (await snap(page)).explorer.position;
    await page.keyboard.down('ArrowRight'); await wait(page, 500);
    assert.ok(distance(before, (await snap(page)).explorer.position) > .12);
    await page.locator('#fire-world').screenshot({ path: `${dir}/explorer-walking.png` });
    await page.keyboard.up('ArrowRight'); await stopped(page, 'Final visual release');
    pass('Final artifact visual capture: explorer translates and release stops'); report.ok = true;
  } else {
  const baseline = learning(await snap(page));
  assert.equal(baseline.gems, 0); assert.equal(baseline.attempts.length, 0);
  assert.equal(await page.locator('#fire-world').getAttribute('tabindex'), '0');
  for (const dir of ['up', 'down', 'left', 'right']) assert.equal(await page.locator(`[data-fire-move="${dir}"]`).isVisible(), true);
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) {
    const result = await hold(page, key); assert.ok(distance(result.before, result.during) > .12, `${key} must visibly translate`);
    if (key === 'ArrowRight') assert.ok(result.during[0] > result.before[0]);
    if (key === 'ArrowLeft') assert.ok(result.during[0] < result.before[0]);
    if (key === 'ArrowUp') assert.ok(result.during[2] < result.before[2]);
    if (key === 'ArrowDown') assert.ok(result.during[2] > result.before[2]);
    report.observations.push(result); await stopped(page, `${key} release`);
  }
  pass('All four arrows translate the visible explorer in sensible directions from one keydown each; release stops');
  for (const key of ['d', 'a', 'w', 's']) { const r = await hold(page, key, 300); assert.ok(distance(r.before, r.during) > .06); }
  assert.deepEqual(learning(await snap(page)), baseline);
  pass('WASD works without repeat events and movement leaves chapter, choices, evidence and gems untouched');
  await page.screenshot({ path: `${dir}/desktop-focused.png` });
  await page.locator('#fire-world').screenshot({ path: `${dir}/explorer-before.png` });
  await page.keyboard.down('ArrowRight'); await wait(page, 450);
  await page.locator('#fire-world').screenshot({ path: `${dir}/explorer-walking.png` });
  await page.keyboard.up('ArrowRight'); await stopped(page, 'Visual capture release');

  await page.keyboard.down('ArrowRight'); await wait(page, 200);
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  const nativeBlur = !(await page.evaluate(() => document.hasFocus()));
  if (!nativeBlur) {
    report.limits.push('Headless Chrome kept document.hasFocus true after another tab became active; the window blur listener was tested with a dispatched blur event instead of claiming native window switching.');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  }
  await page.bringToFront(); await stopped(page, 'Window blur must clear held direction'); await page.keyboard.up('ArrowRight'); await other.close();
  pass(`${nativeBlur ? 'Native tab blur' : 'Dispatched window blur'} clears a held direction; returning does not resume movement`);

  await page.locator('#fire-world').focus(); await page.keyboard.down('ArrowRight'); await wait(page, 180);
  await page.locator('#fire-comfort').click(); await stopped(page, 'Opening dialog clears movement'); await page.keyboard.up('ArrowRight');
  await page.locator('#fire-skin').focus(); await page.keyboard.type('wasd'); await stopped(page, 'Typing on native select must not move');
  await page.keyboard.press('Escape'); await stopped(page, 'Closing dialog does not restart');
  await page.locator('#map-cathedral').focus(); const taskBefore = learning(await snap(page));
  for (const key of ['ArrowLeft', 'ArrowUp', 'w', 'a', 's', 'd']) await page.keyboard.press(key);
  await stopped(page, 'Activity focus must not move explorer'); assert.deepEqual(learning(await snap(page)), taskBefore);
  pass('Dialog entry stops movement; native input and activity focus keep movement keys out of the scene');

  await page.locator('#fire-world').focus(); await hold(page, 'ArrowLeft', 800);
  const right = page.locator('[data-fire-move="right"]'); await right.scrollIntoViewIfNeeded();
  const box = await right.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const mouseBefore = (await snap(page)).explorer.position; await page.mouse.down(); await wait(page, 400);
  assert.ok(distance(mouseBefore, (await snap(page)).explorer.position) > .08);
  await page.mouse.move(3, 3); await page.mouse.up(); await stopped(page, 'Pointer released outside button');
  pass('Held visible directional button moves; pointer capture release outside its target stops');

  const mobile = await opened({ width: 320, reduced: true }); const mp = mobile.page;
  const mobileBase = learning(await snap(mp)); const r = await hold(mp, 'ArrowRight', 600); assert.ok(distance(r.before, r.during) > .12);
  await stopped(mp, 'Reduced motion key release');
  const cdp = await mobile.context.newCDPSession(mp); const left = mp.locator('[data-fire-move="left"]'); await left.scrollIntoViewIfNeeded(); const touchBox = await left.boundingBox();
  const touchPoint = { x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2, radiusX: 4, radiusY: 4, id: 1 };
  const touchBefore = (await snap(mp)).explorer.position;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] }); await wait(mp, 500);
  assert.ok(distance(touchBefore, (await snap(mp)).explorer.position) > .1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await stopped(mp, 'Touch end');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] }); await wait(mp, 150);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await stopped(mp, 'Touch cancel');
  assert.deepEqual(learning(await snap(mp)), mobileBase);
  await mp.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 2);
  await mp.screenshot({ path: `${dir}/mobile320-reduced.png` }); await cdp.detach();
  pass('320px reduced-motion translation, real CDP touch hold/end/cancel, no overflow and unchanged learning state');

  const earned = await opened({ earned: true, reduced: true, width: 1024 }); const ep = earned.page;
  for (let chapter = 0; chapter < 5; chapter++) {
    await ep.locator(`[data-chapter="${chapter}"]`).click(); await ep.waitForFunction(() => __fire.snapshot().explorer.arrived);
    await ep.locator('#fire-walk-focus').click(); await ep.locator('#fire-world').focus(); const before = learning(await snap(ep));
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) { await hold(ep, key, 250); inside((await snap(ep)).explorer); }
    await stopped(ep, `Station ${chapter}`); assert.deepEqual(learning(await snap(ep)), before);
    await ep.screenshot({ path: `${dir}/station-${chapter}.png` });
    report.observations.push({ station: chapter, explorer: (await snap(ep)).explorer });
  }
  await hold(ep, 'ArrowRight', 5000); const edge = (await snap(ep)).explorer; inside(edge);
  await ep.keyboard.down('ArrowRight'); await wait(ep, 500);
  const edgeDuring = (await snap(ep)).explorer; assert.ok(distance(edge.position, edgeDuring.position) < .015);
  assert.equal(edgeDuring.movement.blocked, true); assert.equal(edgeDuring.action, 'Idle');
  assert.match(await ep.locator('#fire-walk-status').innerText(), /Edge of this stop/);
  await ep.screenshot({ path: `${dir}/boundary-feedback.png` });
  await ep.keyboard.up('ArrowRight'); await stopped(ep, 'Walking bounds');
  assert.equal((await snap(ep)).gems, 100);
  pass('Five genuinely earned demo stations support movement within ground bounds; sustained edge input cannot escape or award gems');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedResponses, []); report.ok = true;
  }
} catch (e) {
  report.ok = false; report.failure = e.stack; process.exitCode = 1; console.error(e);
  if (active && !active.isClosed()) await active.screenshot({ path: `${dir}/FAILURE.png` }).catch(() => {});
} finally {
  fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  for (const c of contexts) await c.close(); await browser.close();
}
