# Great Fire of London: source brief and scene contract

Prepared 7 September 2026 for the next Schoolgle Worlds adventure. This document separates historical evidence, proposed learning tasks and the implemented illustrative scene.

## Scene API

```js
import {createFireWorld} from './fire-world.js';
const world = createFireWorld(container, {
  reducedMotion: false,
  onSelect: chapterIndex => { /* parent controls access and learning */ }
});
world.setChapter(0);          // 0–4
world.setReducedMotion(true);
world.dispose();
```

The module provides no pupil account, assessment, rewards or curriculum claims. It uses original procedural geometry/textures and no external assets. The parent owns accessible DOM chapter buttons, narration, quizzes, progression and evidence recording. Taps call `onSelect`; a drag of 8 pixels or more changes the view without selecting. Reduced motion freezes water/smoke and renders on demand. Resize, tab visibility and disposal are handled internally.

| Index | Scene sign | Visual state | Proposed learning emphasis |
| --- | --- | --- | --- |
| 0 | London | Daylight, bridge houses and Old St Paul's before the fire | Compare London then and now; locate river, bridge and closely packed buildings |
| 1 | Bakery | Night, warm bakery light | Locate Pudding Lane; distinguish where the fire began from uncertainty about exact ignition |
| 2 | Evidence | Muted sky and restrained distant smoke; diary prop | Use diary evidence; explain how dry conditions, wind and dense buildings helped spread |
| 3 | Helping | Lighter sky, smoke and additional river boats | Explain community response and how the river helped people move possessions |
| 4 | Rebuilding | Incomplete brick buildings/scaffolds and illustrative cathedral ruins | Put rebuilding after the fire; explain why rebuilding took years and some rules changed |

These are chapter illustrations, not a day-by-day simulation. The last chapter jumps forward to later rebuilding. The model must not be narrated as London being rebuilt immediately when the fire ended.

## Historical content to use

**The fire began at Thomas Farriner's bakery in Pudding Lane early on 2 September 1666. Its precise ignition is uncertain.** London Museum describes a possible oven spark, not a proven cause. A dry summer, closely packed buildings, stored combustible goods and strong wind helped it spread. Prefer “The fire began in the bakery; we do not know exactly how it started.” [London Museum: The Great Fire of London](https://www.londonmuseum.org.uk/collections/london-stories/great-fire-of-london/).

**Pupils should reason from evidence rather than identify a supposed villain.** Pepys recorded what he saw and what others told him. A diary is valuable evidence but one person's view, not a complete record. Compare an observation with something heard from another person. [The National Archives: extracts from Samuel Pepys' diary](https://www.nationalarchives.gov.uk/education/resources/great-fire-of-london-examine-the-evidence/extracts-from-samuel-pepys-diary/), [extracts from John Evelyn's diary](https://www.nationalarchives.gov.uk/education/resources/great-fire-of-london-examine-the-evidence/extracts-from-john-evelyns-diary/).

**The river and community response matter.** London's local response involved parish equipment and people working together. The game should observe and explain historical equipment, not ask children to fight a fire, demolish buildings, mix materials or copy dangerous historical practices. The Archives' KS1 pack offers source questions with simplified transcripts. [The National Archives: how London changed](https://www.nationalarchives.gov.uk/education/resources/fire-of-london/).

**Old London Bridge was inhabited and survived the 1666 fire.** An earlier 1633 fire had left a gap that helped prevent spread across the bridge to the south. The model has an open section near its city end; its reduced number of arches is not a factual count. [London Museum: London Bridge](https://www.londonmuseum.org.uk/collections/london-stories/london-bridge/).

**The cathedral in 1666 was Old St Paul's, not today's domed building.** Its medieval spire had already burned down in 1561. The scene therefore uses a square crossing tower, long Gothic body and a simplified classical west portico, without a spire or dome. The new cathedral's design and construction came much later. [London Museum: a history of St Paul's Cathedral](https://www.londonmuseum.org.uk/collections/london-stories/a-history-of-st-pauls-cathedral/), [St Paul's Cathedral: timeline](https://www.stpauls.co.uk/our-timeline).

**Rebuilding took years.** The city largely retained its previous foundations and street pattern, and many rebuilt buildings used brick or stone. Some people were still in temporary accommodation years later. The final scene shows only partial construction, not a complete new city. [London Museum: the Great Fire](https://www.londonmuseum.org.uk/collections/london-stories/great-fire-of-london/), [the housing crisis](https://www.londonmuseum.org.uk/collections/london-stories/great-fire-london-housing-crisis/).

**Brick was not introduced by the fire.** London already had brick buildings; post-fire rules strengthened requirements. A brick warehouse is present in the first scene for this reason. Do not teach that every pre-fire house was wooden, or that the fire ended the plague. [London Museum: three myths about the Great Fire](https://www.londonmuseum.org.uk/collections/london-stories/myths-great-fire-london/).

## Useful existing teaching materials

London Museum has KS1 teacher notes, a glossary, source activities and films with BSL versions. These are useful reference material for original tasks; their media and worksheets have not been copied into the game. [London Museum: school resources](https://www.londonmuseum.org.uk/schools-communities/schools/resources/the-great-fire-of-london/).

Newer museum research identifies Thomas Dagger as an early witness at Farriner's bakery. This supports keeping historical content reviewable rather than treating familiar classroom stories as unchanging. Avoid unnecessary casualty totals: surviving records and older teaching summaries require careful qualification. [London Museum: first-witness research, 2023](https://www.londonmuseum.org.uk/about/press/press-releases/first-witness-to-the-great-fire-of-london-uncovered/).

## Interpretation and testing limits

Buildings, labels, stage transitions, camera, lighting and chapter props are original game design. Geography is rotated and compressed; bridge arch count, facade details, cathedral damage and specific rebuilding sites are illustrative. No visual should be presented as an exact survey or an archaeological reconstruction.

The standalone renderer passed tests for five distinct chapter images, correct callbacks at desktop/narrow-pane/tablet/mobile sizes, exact reduced-motion stability, drag suppression and repeatable disposal, without browser or shader errors. Review images and report are in `test-results/fire-art/`. A measured scene reported 156 draw calls, 26,052 rendered triangles and 22 textures, including shadow work. This is not physical-tablet performance evidence or a learning-effectiveness evaluation. Parent-game integration and curriculum/assessment review remain separate work.
