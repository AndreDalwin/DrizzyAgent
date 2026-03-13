# Legacy Generated Config Adoption Policy

This policy defines how the override-only installer handles old configs that still
contain generated `agents` and `categories` model pins.

## Generated Territory

Legacy generated territory is limited to these paths:

- `agents.*.model`
- `agents.*.variant`
- `categories.*.model`
- `categories.*.variant`

The installer must not guess ownership outside those fields. Mixed subtrees stay
untouched unless a later adoption step can prove every generated-territory value
matches exactly.

## Normal Startup

Normal runtime startup is read-only for legacy generated configs.

- `migrateConfigFile()` may still handle unrelated legacy key migrations.
- Startup must not strip legacy generated pins.
- Startup must not rewrite legacy generated pins to newer defaults.
- Ambiguous legacy configs are preserved as-is.

This prevents accidental data loss before the user explicitly chooses to adopt the
override-only layout.

## Explicit Adoption Path

Rerunning `drizzy-agent install` is the only automatic file-mutating adoption path.

During rerun install:

1. Compute the current generated defaults for the chosen install intent.
2. Compare every legacy generated-territory `model` and `variant` field against the
   current generated defaults.
3. Abort adoption if any compared field is not an exact string match.
4. If every compared field matches exactly, create a backup before writing.
5. Strip only the exact-match generated-territory fields and preserve everything else.

## Exact-Match Gate

Automatic adoption is allowed only when the legacy file proves it still contains the
current generated defaults for the chosen install intent.

- Equality is exact, not fuzzy.
- Missing, renamed, or different values count as mismatches.
- Only exact-match generated-territory fields may be removed.
- User-authored fields outside generated territory are always preserved.

## Mismatch Handling

Any mismatch aborts automatic adoption.

When adoption aborts:

- print a mismatch report that identifies every non-matching generated-territory path
- leave the config file untouched
- do not partially strip legacy pins
- require the user to resolve the mismatch manually or keep the legacy config

Safety wins over cleanup: if ownership is unclear, preserve the file.
