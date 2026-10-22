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

Capture mode hides the buttons, the readout, the hint, the mouse cursor and the keyboard focus outline, and loops the sequence for as long as the page stays open. One pass takes about 44 s. After "world" the camera glides back to "hello world" without a break, so from the second pass on its path repeats. The particles keep drifting, though, and their motion does not repeat with the pass, so one recorded pass, played as a video loop, jumps where it starts again.

Clicks, drags, the wheel and keys do not interrupt it. Press Escape to leave capture mode and get the controls back.

Escape also takes `#capture` out of the address, without reloading, so adding it back starts capture mode again. Where the page may not change its address, as in some embedded viewers, the anchor stays; there, reload the page to record again.

With reduced motion turned on in the operating system, the page never glides. Outside capture mode it does not play the sequence at load, and "Find the angle" jumps. Play and capture mode cut from message to message, holding 4 s at each, so one capture pass takes 24 s. If reduced motion turns on while Play or capture mode is gliding, the camera cuts straight to the message it was heading for. If it turns on during a "Find the angle" glide or a snap, the camera lands on that message at once, and a coast stops at once.
