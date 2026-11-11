# R-31 · Export on the phone → import on the simulator

Priority: P0 · Spec: 08 (Debug) · Where: Phone + Simulator

Checks backup with real data without writing anything on the phone: export only reads.

Precondition: the TestFlight build on the phone with real data; on the simulator, a fresh install
with no data of its own — a backup restores only into an empty app, never merges. Reinstall the
Release build (`xcrun simctl uninstall booted com.artemchebotarov.hybro`, then install the `.app`
again); this wipes the simulator's test data, so it is the end of the chain.

## Steps

On the phone:

1. Open the Library tab and tap its title five times quickly — a pause of more than 1.5 s starts the count over.
2. On the debug screen tap "Export backup" and send the file to the Mac (AirDrop, or save to
   Files).

On the simulator:

3. Drag the file onto the simulator window (it lands in Files), or copy it into the simulator's
   Files storage ("On My iPhone").
4. Library → tap the title five times quickly → "Import backup", pick the file.
5. In the restore confirmation tap "Cancel". Check the data is unchanged.
6. Repeat step 4, this time confirm the restore.

## Expect

- Step 2: the share sheet opens with a JSON file; no error.
- Step 5: nothing changes.
- Step 6: a success alert. The simulator now shows the phone's cycles, the active cycle on the
  same week and day, and the same exercise history.
- The phone's data is unchanged.
