# components

Screen-level React components: composed from `design/` primitives and typed by `domain/` and
`usecases/`, but not themselves reusable design primitives (see `design/README.md`) and not
routes (see `app/README.md`). Kept outside `app/` because Expo Router treats every file directly
under `app/` as a route — see https://docs.expo.dev/router/basics/core-concepts/, "Non-navigation
components live outside the app directory".
