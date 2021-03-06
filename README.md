# funtangle
Launchpad node.js thing

## Features
 * 4 bank midi sequencer - sequence 4 midi devices from your Novation launchpad
 * Mute step & skip step
 * Midi clock (sync) and play/stop/continue sent for chaining midi devices
 * Special case support for Korg Volca Beats and Sample
 * Scale patterns create pleasant note layouts in all kinds of scales
 * Chord patterns hold chord progressions, specified by teoria name/octave,
   list of named notes or list of midi note numbers
 * Ping pong patterns reverse when you get to the end of the sequence
 * Locking patterns wait until there's a new note before sending `midi_off`
 * Easily identify midi devices attached to your machine with `node index.js ports`

## Install

You will need [node & npm][node] to install and use Funtangle. The intention is
for it to run on a Raspberry Pi, but to date it's only tested on OSX.

First clone the repo and install the dependencies:

    $ git clone https://github.com/drsm79/funtangle.git
    $ cd funtangle
    $ npm install

## Run

Next run `node index.js ports` to see what you've got plugged in where:

    $ node index.js ports
    ==> Midi outputs
    MiniBrute :  0
    MiniBrute MIDI Interface :  1
    ZOOM R16_R24 :  2
    Streichfett :  3
    MicroBrute :  4
    MicroBrute MIDI Interface :  5
    Launchpad Mini :  6
    MIDI Monitor (Untitled) :  7
    ==> Midi inputs
    MiniBrute :  0
    MiniBrute MIDI Interface :  1
    ZOOM R16_R24 :  2
    Streichfett :  3
    MicroBrute :  4
    MicroBrute MIDI Interface :  5
    Launchpad Mini :  6
    WARNING: uneven midi (more inputs than outputs or vice versa)

Now you can launch funtangle with the midi devices you want to use:

    $ node index.js -l6 --synth1 0 --synth2 3 --synth3 4
    start funtangle
    setting up Launchpad on port:6
    running launchpad: Launchpad Mini
    MiniBrute is go!
    Streichfett is go!
    MicroBrute is go!
    ssshhhh!

## Buttons
The round buttons across the top are currently just used as tick markers. They
will eventually work as accent and step on/off buttons.

The round buttons down the side (labelled A-H) have per layout functions. For
the step entry layout they are; A: play/pause, B: stop, C: unused, D: up, E:
down, F: bank (cycles through the midi devices), G: shift 1, H: shift 2. Shift
1 & 2 can be used together for a third shift.

In the step entry layout the main 8 x 8 grid is step entry, ticks are
horizontal, notes of the scale vertical. Shift 1 changes the probability of a
note being played to 50%, shift 2 changes it to 75%.

## Contribute

Ideas and patches are very welcome in the [issue tracker][issues].

[node]: https://nodejs.org/
[issues]: https://github.com/drsm79/funtangle/issues
