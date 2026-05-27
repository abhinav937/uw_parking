# Changelog Fragments

Each change gets a small `.md` file in this directory named after the date and a short slug:

```
YYYY-MM-DD-short-slug.md
```

When cutting a release, concatenate all fragments into `CHANGELOG.md` and delete them.

## Categories used

- **feat** – new user-facing feature
- **fix** – bug fix
- **perf** – performance improvement
- **refactor** – internal restructure with no behaviour change
- **style** – visual / CSS tweak
- **chore** – tooling, deps, config
