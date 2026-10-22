# animation

A cloud of glowing particles that hides six messages, each readable from its own angle: "hello world", a smiling face, and then "What", "a", "beautiful", "world".

## Open it

Open `index.html` in a browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari. It needs no server and no build step, so it works straight from disk.

At load the page plays the sequence once. It glides to each message's angle in turn, holds there for 3 s and stops at "world".

- Drag, or use the arrow keys, to change the angle. The wheel, a pinch or the + and − keys zoom.
- "Find the angle" glides to the next message. Play plays the whole sequence again.
- A press or drag on the scene, the wheel, a pinch, an arrow key or a zoom key stops the sequence.

## Record it

Add `#capture` to the page's address, for example `index.html#capture`, and load it.

Capture mode hides the buttons, the readout, the hint and the mouse cursor, and loops the sequence for as long as the page stays open. One pass takes about 44 s, so a screen recorder can capture a clean loop.

Clicks, drags, the wheel and keys do not interrupt it. Press Escape to leave capture mode and get the controls back.

With reduced motion turned on in the operating system, the page never glides. Outside capture mode it does not play the sequence at load, and "Find the angle" jumps. Play and capture mode cut from message to message, holding 4 s at each, so one capture pass takes 24 s.
