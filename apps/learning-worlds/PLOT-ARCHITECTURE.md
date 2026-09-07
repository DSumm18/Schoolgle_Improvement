# The Midnight Letter: architectural reconstruction

Updated 7 September 2026.

The scene is an original interpretation of the old Palace of Westminster around 1605. It is designed to make two recognisable historic buildings central to the adventure. It is not an exact archaeological model, a scale plan or a depiction of today's Houses of Parliament.

## What changed

The former generic distant palace and foreground row of timber houses have been replaced by a dominant stone Westminster Hall and a distinct St Stephen's Chapel. The Hall has an elongated footprint, buttressed window bays, a great pointed gable window, stone portal, steep lead-covered roof and two roof lanterns. The Chapel is represented with an upper storey over an undercroft, tall traceried windows, buttress bays and a separate lead roof. Lower connecting ranges suggest the old palace's irregular cluster of buildings. The river and a few smaller buildings remain as context.

The camera now looks towards the architecture rather than the centre of a largely empty square. Building labels identify Westminster Hall and St Stephen's Chapel. Five chapter stations keep their original index mapping: People, Warning, Search, Story, Remember.

## Primary evidence and interpretation

- [UK Parliament: the hammer-beam roof](https://www.parliament.uk/about/living-heritage/building/palace/westminsterhall/architecture/the-hammer-beam-roof-/) documents a roof measuring 20.7 by 73.2 metres, massive buttresses, a lead covering and two roof lanterns completed in 1397–98. The model reflects the elongated mass and those features. It does not reconstruct the concealed hammer-beam interior.
- [UK Parliament: Parliament in 1605](https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/the-gunpowder-plot-of-1605/overview/the-plot-and-its-discovery/parliament-in-1605/) describes the palace as a collection of medieval buildings. The model deliberately excludes the current nineteenth-century clock tower and neo-Gothic riverfront.
- [UK Parliament: St Stephen's Chapel design](https://www.parliament.uk/about/living-heritage/building/palace/ststephenschapel/medievalststephens/building-st-stephens/design/) describes its Gothic royal-chapel development and design relationship with Sainte-Chapelle.
- [UK Parliament: St Stephen's Chapel, 1184–1363](https://www.parliament.uk/about/living-heritage/building/palace/estatehistory/the-middle-ages/early-chapel-st-stephen/) provides the chapel's medieval context.
- [University of York / UK Parliament / History of Parliament reconstruction project](https://heritage-research.org/case-studies/st-stephens-chapel-westminster-visual-and-political-culture-1292-1941/) distinguishes its carefully researched medieval and later Commons reconstructions. Our model does not claim that project's level of archaeological verification.
- [UK Parliament: Palace of Westminster in 1605](https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/the-gunpowder-plot-of-1605/collections/palace-of-westminster-in-1605/) identifies the displayed plan as a source published in 1807. It must not be described as a contemporary 1605 survey.

Exact facade tracery, turret details, material colours, lighting, positions of the learning stations and the compressed relationship between buildings are original design interpretations. No historic image or third-party model is embedded in the game.

## Verification

The real Three.js renderer was inspected at 1440×900, 800×816, 492×684 and 390×340. All five 3D labels remained within the canvas and returned the correct chapter index when clicked. Reduced-motion screenshots were identical, and there were no browser or shader errors. The updated buildings were also inspected inside the complete application at desktop 1440×900 and tablet 1024×768.

Review images and checks are in `test-results/plot-art/architecture-*.png` and `architecture-report.json`. The measured mobile harness reported 176 draw calls and 72,500 rendered triangles including shadow work before the final minor masonry-map change. This is renderer instrumentation, not proof of frame rate on a physical school tablet.

The narrow tablet pane still limits the size of architectural labels. Accessible chapter controls remain outside the canvas. Further pupil testing and historical specialist review would be required before describing the reconstruction as validated or claiming that its visual appeal improves learning.
