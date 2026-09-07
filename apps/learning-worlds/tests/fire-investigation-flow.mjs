import assert from 'node:assert/strict';
export async function completeStreetInvestigation(page,{beforeGems=20,screenshotDir}={}){
 const snap=()=>page.evaluate(()=>__fire.snapshot());
 const pending=async()=>{assert.equal((await snap()).gems,beforeGems);assert.equal(await page.locator('#fire-next').count(),0);};
 assert.equal(await page.locator('#fi-predict').isDisabled(),true);
 await page.locator('[data-fi-prediction="same"]').focus();await page.keyboard.press('Space');await page.locator('#fi-predict').click();
 assert.equal(await page.locator('#fi-run').isDisabled(),true);await page.locator('[data-fi-gap="1"]').tap();const partial=(await snap()).draft;
 await page.locator('#fire-look').click();await page.keyboard.press('Escape');assert.deepEqual((await snap()).draft,partial);
 await page.locator('#fi-run').click();await page.locator('#fi-observe-next').waitFor();await pending();
 if(screenshotDir)await page.screenshot({path:`${screenshotDir}/street-comparison.png`});
 await page.locator('#fi-observe-next').click();await page.locator('[data-fi-change="same"]').click();await page.locator('[data-fi-reason="wind"]').click();await page.locator('#fi-explain').click();await pending();assert.equal(await page.locator('[data-fi-change="fewer"]').count(),1);
 await page.locator('[data-fi-change="fewer"]').click();await page.locator('[data-fi-reason="gap"]').click();await page.locator('#fi-explain').click();await pending();await page.locator('[data-fi-reflection="changed"]').click();
 await page.locator('[data-fi-gap="0"]').click();await page.locator('#fi-run').click();await page.locator('#fi-transfer-next').waitFor();assert.equal(await page.locator('#fi-transfer-next').isDisabled(),true);await pending();
 if(screenshotDir)await page.screenshot({path:`${screenshotDir}/street-transfer-unhelpful.png`});
 await page.locator('#fi-transfer-retry').click();await page.locator('[data-fi-gap="3"]').click();await page.locator('#fi-run').click();await page.locator('#fi-transfer-next').click();await pending();
 await page.locator('[data-fi-transfer-reason="count"]').click();await page.locator('#fi-transfer-explain').click();await pending();assert.equal(await page.locator('#fi-finish').count(),0);
 await page.locator('[data-fi-transfer-reason="route"]').click();await page.locator('#fi-transfer-explain').click();await pending();
 if(screenshotDir)await page.screenshot({path:`${screenshotDir}/street-investigation-summary.png`});
 assert.match(await page.locator('.fi-history').innerText(),/dry summer, strong wind and closely packed timber buildings/);
 const events=(await snap()).attempts;
 const prediction=events.findLast(a=>a.question==='Paper-street first prediction');assert.equal(prediction.kind,'observation');assert.equal(prediction.correct,null);assert.equal(JSON.parse(prediction.response).prediction,'same');
 const outcomes=events.filter(a=>a.question==='Paper-street model outcome').map(a=>JSON.parse(a.response));assert.deepEqual(outcomes.slice(-3).map(o=>[o.layout,o.changedCount,o.lastHouseReached]),[['practice',2,false],['transfer',4,true],['transfer',2,false]]);
 assert.ok(events.some(a=>a.question==='Paper-street evidence explanation'&&a.correct===false));assert.ok(events.some(a=>a.question==='Paper-street transfer explanation'&&a.correct===false));
 await page.locator('#fi-finish').click();
}
