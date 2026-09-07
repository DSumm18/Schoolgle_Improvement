# The Midnight Letter: the explorer's wardrobe

7 September 2026. Implemented in `src/plot-costume.js`; wardrobe UI, saved selection and learning-evidence integration belong to the main game. This is an original stylised costume system for a contemporary child explorer visiting a 1605 story. It is not a reconstruction of a particular historic child's clothes.

## Keep the child; change the clothes

The 3D preview preserves Leo/Maya's original face proportions, eyes, eyebrows, curls, skin colour palette and Maya's ponytail. Modern mode includes the original-style safari hat, teal jacket, shorts, scarf and backpack. Selecting period clothing changes the clothing geometry, including the silhouette and headwear, rather than replacing the child with a historic person.

Both complete outfits are available to either explorer. This is present-day dress-up choice, not a claim that historical clothing conventions were unrestricted. No sex or gender information is requested. The retained visible ponytail is an identity/readability choice; it is not an exact demonstration of historical coif fitting.

| Option | Visible pieces | What is deliberately simplified |
|---|---|---|
| **Doublet and breeches** (`doublet`) | Fitted blue upper garment with buttons, waist tabs and stitched seams; full rust-coloured breeches; stockings; linen cuffs and small folded collar; soft cloth cap; shoulder cloak and shoes | Child proportions, colours, trims, shoe construction and cloak cut are original. The flat cap is an interpretation, not a specific surviving hat. |
| **Bodice and petticoat** (`petticoat`) | Green fitted upper garment with visible lacing; long pleated petticoat and contrasting hem; linen neckline, apron and coif; stockings, shoes and a cloak | The easy-to-read lacing and separate layers teach recognition, not historic tailoring. This is not an exact royal dress or a generic uniform for every woman in 1605. |

Long outer garments existed, but an automatic switch into a Victorian frock coat would be the wrong visual shortcut. These silhouettes draw on fitted upper garments, full lower garments, caps and layered clothing around the start of the seventeenth century.

## Checked museum evidence

- **National Trust, Piers Legh X, 1600–1610 (NT 499938):** the collection record describes an English portrait with a fitted doublet, full hose and white linen collar/cuffs. This is direct support close to the game's year for the first outfit's main silhouette. The portrait does not establish how every Londoner dressed. [Collection record](https://www.nationaltrustcollections.org.uk/object/499938).
- **The Met, British coif, 1600–1630 (64.101.1242):** a surviving linen head covering with silk and metal decoration. Its account distinguishes plain linen coifs from elaborate embroidered examples and explains close fitting and hair covering. This supports the name and basic cap concept; our open-fringe/ponytail version deliberately preserves avatar identity. [Collection record](https://www.metmuseum.org/art/collection/search/228951).
- **National Portrait Gallery, Anne of Denmark (NPG 6918):** the live collection currently dates John de Critz's portrait to approximately **1606–1608**. Older references sometimes give 1605–1610. It is useful evidence of court representation near the game period, not ordinary children's streetwear. The game does not copy its image or claim to reproduce the queen's outfit. [Collection record](https://www.npg.org.uk/collections/search/portrait/mw202589/Anne-of-Denmark).
- **The Met, British waistcoat, 1615–20 (23.170.1):** a surviving informal bodice/jacket in linen, silk and metal. It is a slightly later comparative object, not evidence that our exact outfit existed in 1605. [Collection record](https://www.metmuseum.org/art/collection/search/81132).
- **V&A, Shakespeare's Magic trail:** the featured English doublet is dated **1615–20**. It is useful nearby-period material culture; the date must stay visible in teacher references. Do not quietly redetermine it as 1605. [Museum trail](https://www.vam.ac.uk/articles/vampa-trail-shakespeares-magic).
- **Shakespeare Birthplace Trust, Tudor farm programme:** describes its educational replicas in wool/linen with buttons, ties and laces; doublets/breeches, long dress layers, aprons and caps. This is a museum education reconstruction of the preceding Tudor period, not a surviving 1605 collection object. It informed practical layer recognition only. [Programme guidance](https://media.shakespeare.org.uk/documents/Life_on_a_Tudor_Farm_-_General_Information_1.pdf).

All meshes, fabric textures and garment details are generated locally by original code. No museum images or third-party character assets have been downloaded or incorporated. Use **“inspired by clothing around 1605”**, not “museum-certified”, “exact 1605 costume” or “what everyone wore”.

## Short learning interaction

Suggested invitation: “You're still Leo/Maya. Before you visit our 1605 story, try clothes inspired by that time. Look for the layers that changed.”

1. Show the same explorer in modern clothes.
2. Let the child preview both complete period outfits. Name the pieces with text and optional narration.
3. Ask one purposeful recognition question, such as “Which piece is the fitted upper garment?” (doublet/bodice as appropriate) or “Which piece is the close-fitting linen cap?” (coif for that outfit).
4. Add an evidence question: “Are these exact clothes from 1605, or our designs inspired by objects and pictures?” Accept the latter, with a short explanation.
5. Confirm the chosen outfit and continue the story. Choosing an outfit is preference; the recognition/evidence answers are the learning observations. Give both outfits equal access and rewards.

Record actual selected responses, the item/objective version, narration or teaching help, correctness and timestamp. Do not infer identity, gender or mastery from a clothing choice. The modern-to-period animation is a visual transition, not an assessment of knowing dates. The main game must keep this preference separate from original Nile progress.

## Module API

```js
import {createCostumePreview, COSTUME_OPTIONS, CLOTHING_FACTS} from './plot-costume.js';

const preview = createCostumePreview(container, {
  character: 'explorer',      // also 'explorer-girl'
  outfit: 'modern',          // also 'doublet', 'petticoat'
  skinTone: 'warm',          // also 'deep', 'light'
  reducedMotion: false
});
preview.setCharacter('explorer-girl');
preview.setOutfit('petticoat');
preview.setSkinTone('deep');
preview.setReducedMotion(true);
preview.dispose();
```

The constructor is synchronous and needs an already-attached container with a CSS height. It returns exactly the setters and `dispose`; it makes no asset request. A zero-height container uses a 280px render fallback, but the UI should set its actual dimensions. If WebGL creation fails, let the parent UI supply a textual/static fallback.

`COSTUME_OPTIONS` contains only the two period choices, with `id`, `name`, `description` and `pieces`. `modern` is supported internally for the before/after transition. `CLOTHING_FACTS` entries contain `id`, `text`, `source` and `url`.

Canvas attributes expose `data-character`, `data-outfit`, `data-skin-tone`, `data-reduced-motion`; `data-changing="true"` exists while the 480ms clothing transition runs. The outfit attribute changes with the actual geometry at the midpoint. Reduced motion changes immediately. Dragging horizontally or using left/right arrows turns the preview; the canvas has an accessible label and description.

The renderer preserves articulated head/arm groups, batches static pieces by material, bounds pixel ratio, pauses GPU rendering while offscreen, and renders static frames only when needed under reduced motion. `dispose()` releases observers, events, animation frames, meshes, materials, textures and the WebGL context; calling it twice is harmless. The parent should mount only the needed preview and dispose it when closing/remounting.

## Observed checks

Chrome headless rendered the real Three.js module through the running Vite server. Reviewed the actual three-column modern/period screenshot and a **150×220** preview. Nine functional checks passed: real geometry changes for outfits; retained identity/skin attributes; changed rendered pixels; pixel-stable reduced motion; completed animated swap; switching to reduced motion mid-swap; keyboard rotation; repeated setters with invalid-tone fallback; idempotent disposal/removal. No page exceptions or rendering-console errors occurred. `node --check src/plot-costume.js` passed.

Temporary visual evidence: `C:\Users\dsumm\AppData\Local\Temp\plot-costume-review.png` and `C:\Users\dsumm\AppData\Local\Temp\plot-costume-small.png`. These are developer inspection captures, not shipped assets. Physical tablets, pupil recognition and integrated game persistence still require the main release QA.
