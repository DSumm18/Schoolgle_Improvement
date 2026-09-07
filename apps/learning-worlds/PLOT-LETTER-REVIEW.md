# Tactile letter review

Reviewed 7 September 2026. Scope: the existing warning-letter task in The Midnight Letter. No wardrobe, world, state or other adventure changes belong to this pass.

## Change

`src/plot-letter.js` and `src/plot-letter.css` provide an illustrated folded packet, raised wax seal, writing surface and unfolded parchment. The existing `src/plot.js` letter stages use those two presentation helpers. Opening shows a short seal-release and paper-unfold animation; reduced motion reveals the readable sheet immediately. Click/tap and keyboard instructions are visible.

The existing `#plot-seal`, `[data-line]` and `[data-answer]` selectors, stage numbers, answer text, recording calls, uncertainty judgement and rewards are unchanged. Opening remains an unassessed action. The warning line and unknown-writer judgement are still required before completing the discovery.

## Tests actually run

Targeted headless Chrome used an isolated Alex demonstration context and progressed through the real people chapter before attempting the letter. It did not alter David’s browser save.

- No evidence-line buttons before opening; Enter on the letter advances to stage 1 and reveals the same three options.
- The normal-motion opening includes the seal-release animation.
- Selecting the wrong line records an incorrect response without awarding the discovery.
- Reload preserves recorded responses but restarts the unfinished letter task with its seal closed.
- The correct warning line alone does not award completion. An incorrect writer judgement also does not; the subsequent correct judgement completes the task and changes gems from 20 to 40.
- At 320px with larger text, Space opens the letter; reduced motion displays the ink immediately with no visible opening flaps. No horizontal overflow occurred.
- Replaying the completed letter did not add more gems.
- No page errors occurred. Both changed JavaScript modules passed `node --check`.

The independent QA agent was notified directly to run the complete Plot regression with the unchanged selectors. This report records targeted results, not an independent full-game completion or pupil effectiveness study.

## Reviewed screenshots

The following PNGs were inspected and copied into the durable local QA artifact directory:

- [Sealed letter in the integrated game](test-results/enhancement/plot-letter/sealed.png)
- [Opened adapted warning](test-results/enhancement/plot-letter/opened.png)
- [Opened letter at 320px with larger text](test-results/enhancement/plot-letter/mobile-large-text.png)

The desktop opened screenshot shows the pointer hovering over one option; all three options have the same hover treatment. This is not a selected answer or correctness marker.

## Historical interpretation

The packet, decorative M seal and paper texture are original illustrations, not a facsimile or a claim about the surviving letter’s appearance or seal. The display continues to identify the warning as a short modern-language adaptation. The existing received date, warning and uncertainty about the author are preserved without expanding the historical claims. Background source review remains in [GUNPOWDER-EDUCATION.md](GUNPOWDER-EDUCATION.md), drawing on [UK Parliament](https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/the-gunpowder-plot-of-1605/) and [The National Archives](https://www.nationalarchives.gov.uk/education/resources/gunpowder-plot/).
