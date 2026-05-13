# Class Builder — Remotion Storyboard

This storyboard uses the same guide structure as the in-app Class Builder product guide.

Source guide data:

`apps/platform/src/lib/product-guides/class-builder.ts`

## Format

- Duration: 90 seconds
- Ratio: 16:9
- Captions: always on
- Voiceover: optional
- Style: clean Schoolgle UI mockups, cursor highlights, step markers, zoomed panels

## Scenes

| Scene | Duration | Caption | Visual |
| --- | ---: | --- | --- |
| Class Builder | 5s | Collect pupil choices. Build explainable draft classes. | Animated title card with pupils, survey and classroom icons. |
| Start with the cohort | 12s | Choose year group or class. | Zoom to the create session panel and highlight survey scope. |
| Pupil survey | 14s | Pupils choose friends and work-well-with pupils. | Child-friendly survey mockup with three choice cards. |
| Monitor completion | 12s | Review submitted and waiting pupils. | Completion dashboard with submitted and waiting counters. |
| Generate draft groups | 16s | Generate and review the explanation. | Draft groups and explanation cards animate into view. |
| Adjust seating | 18s | Move tables. Swap pupils. Lock the plan. | Classroom canvas with draggable tables and pupil cards. |
| Export and use | 8s | Export results. Staff remain in control. | Export button and final checklist. |

## Voiceover

1. "Class Builder helps staff collect pupil preferences and create explainable draft classes for next year."
2. "Choose whether this is a year group survey or a current class survey. The pupil list is automatically limited to that cohort."
3. "Pupils select their own name, then choose up to three friends and up to three pupils they work well with."
4. "Staff can see who has submitted, who is still waiting, and all the choices made by pupils."
5. "The system suggests draft classes using mutual friendships, work preferences, class size and key balance information. It explains the trade-offs."
6. "Teachers can move tables around the classroom canvas and swap pupils between seats before locking the final seating plan."
7. "Export the results and use the plan as a practical starting point for staff discussion."

## Remotion Build Notes

- Render from the structured guide object rather than hard-coded scene text.
- Use zoomed UI mockups rather than full-screen tiny screenshots.
- Highlight click targets with animated rings.
- Keep the phrase "staff remain in control" in the final scene.
- Keep future QR launchpad references out of this video unless the feature exists in product.

