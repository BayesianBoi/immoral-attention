# Requirements for working on this project

Read this before doing anything. These are non-negotiable.

## How to work

- **Update docs as you go.** After finishing any chunk of work, update `tasks.md` and
  any relevant `.md` files. Do not batch updates for later. If you discovered something
  about the code or a limitation, write it down immediately.
- **Keep code simple.** Short functions, minimal abstraction. If you can do it in 10 lines,
  do not write 50. No wrapper classes, no config objects, no "utils" files for one-off helpers.
- **Keep comments concise.** One line max. Only where the logic is not obvious from the code.
  Do not write docstrings that restate what the function name already says.
- **Keep headers and markdown concise.** No filler, no padding. Say what you mean in as
  few words as possible.
- **Write like a human.** No em dashes. No "leveraging", "facilitating", "it's worth noting",
  "importantly", "notably", "comprehensive", "robust", "utilize". Write plainly. If a sentence
  sounds like it came from ChatGPT, rewrite it.

## How to think

- **Match the lab version.** The web experiment must produce the same trial structure,
  stimuli, and behavioral data as the lab version in `src/lab/`. When in doubt, check the
  original Python script.
- **Be skeptical of your own output.** After producing any result, ask: does this make
  sense? Check it a second way.
- **Flag uncertainty.** If you are not sure about a variable's meaning, scale direction,
  or coding, say so explicitly. Do not guess and move on.

## File conventions

- `docs/tasks.md` -- current task list, update after every completed task
- `docs/handover.md` -- project documentation, update when you learn something new
- `src/lab/` -- original PsychoPy + EyeLink experiment (do not modify)
- `src/web/` -- Pavlovia + WebGazer web experiment
- `src/web/index.html` -- experiment entry point
- `src/web/experiment.js` -- trial logic (mirrors src/lab/ImmoralAttention.py)
- `src/web/style.css` -- experiment styling
- `src/web/lib/` -- third-party libraries (webgazer.min.js)

## What not to do

- Do not modify files in `src/lab/`. That is the reference implementation.
- Do not create new files unless you genuinely need them.
- Do not refactor working code unless asked.
- Do not install new packages without stating why.
- Do not write summaries at the end of your responses restating what you just did.
- Do not add emoji to anything.
