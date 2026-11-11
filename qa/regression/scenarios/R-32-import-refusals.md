# R-32 · Import: cancel and a wrong file

Priority: P1 · Spec: 08 (Debug) · Where: Simulator, by hand

Precondition: some data on the simulator.

## Steps

1. Library → tap the title five times quickly → "Export backup"; save the file to Files.
2. "Import backup" → pick that file → cancel in the confirmation.
3. "Import backup" → pick a file that is not a backup (e.g. any text or image file in Files).
4. "Import backup" → close the file picker without choosing.

## Expect

- Step 1: the share sheet opens with a JSON file.
- Step 2: nothing changes.
- Step 3: an error says the file can't be restored and that the data was not changed.
- Step 4: nothing happens.
- A file from an older build is refused too; that path is covered by unit tests, not here.
