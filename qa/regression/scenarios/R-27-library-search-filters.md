# R-27 · Library: search, filters, create from search

Priority: P1 · Spec: 08.6 · Where: Simulator

Precondition: any.

## Steps

1. Open the Library tab; scroll through.
2. Type "curl" into the search.
3. Type a name that matches nothing, e.g. "zzz".
4. Clear the search. Open the filters, pick a muscle group and "Performed only"; apply.
5. Reset the filters. Close the app completely and open it again; open Library.
6. Search "zzz" again and use the create action from the empty result.

## Expect

- Step 1: sections by muscle group, then power, intervals and mobility; each row shows its last
  set or that it was never performed.
- Step 2: only matching exercises.
- Step 3: an empty result offering to create an exercise with that name.
- Step 4: the sheet's button shows the live count of matches; after applying, only performed
  exercises of that group.
- Step 5: filters are not kept between launches.
- Step 6: the new-exercise flow starts with the typed name filled in (R-28).
