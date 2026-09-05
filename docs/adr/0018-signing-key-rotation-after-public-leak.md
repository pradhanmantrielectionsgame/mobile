# ADR-0018: Rotate the Android Signing Key After It Leaked to the Public Repo

## Status

Accepted (2026-09-05)

## Context

On 2026-09-04 the PWABuilder output zip — `PradhanMantri - Google Play
package.zip`, containing `signing.keystore` and `signing-key-info.txt` with the
keystore and key passwords in plaintext — was committed to
`github.com/pradhanmantrielectionsgame/mobile`, which is **public**.

The mechanism matters more than the mistake, because the guardrail that should
have caught it was present and did nothing:

- The zip was swept into commit `ee13456` at 11:53 by a broad `git add`.
- The `*.zip` / `*.keystore` / `signing-key-info.txt` rules were added to
  `.gitignore` in `a6588b0` at 11:58 — **five minutes later**.
- `.gitignore` has no effect on a path already in the index, so the rules were
  inert from the moment they landed.
- Worse, they made the repository *look* safe: `git status` read clean, and
  `git check-ignore -v` reported the file as matching the pattern. Every signal
  short of `git ls-files` said "handled".

What the leaked key buys an attacker is specific to this app's architecture.
`mobile/.well-known/assetlinks.json` tells Chrome that an app with package name
`com.pradhanmantrielectionsgame.twa` **signed with a given certificate** is
authorized to act for the domain. Anyone holding the keystore could therefore
build a TWA that Chrome renders full-screen, with no address bar and no warning,
against our own domain — and could also sign anything Android would accept as an
update to an installed copy of the app.

Discovery was incidental: while looking for the APK to install on the emulator,
`git ls-files` showed the zip as tracked even though `git status` was empty.

## Decision

**Treat the key as compromised and rotate it**, rather than rely on removing the
file from GitHub.

Concretely, and in this order:

1. `git rm --cached` the zip, and add defensive `.env` / `*.pem` / `*.p12` /
   `*.pfx` patterns.
2. Purge it from all history with `git filter-repo` (241 → 196 commits) and
   force-push `mobile/source`. A mirror of the original history is kept at
   `D:\pme-backup\pme-20260904.git`.
3. Generate a new keystore **outside the repo** at
   `D:\keys\pme-release.keystore` (PKCS12, RSA-2048, ~2053 expiry).
4. Point `assetlinks.json` at the new fingerprint
   `CF:C3:E0:14:78:D6:E5:9D:...:EA:2E:60:98`, replacing
   `5E:4E:3B:83:...:82:86:7C:7D`, and deploy.
5. Repackage in PWABuilder with the new keystore; verify the `.aab` and `.apk`
   both report the new fingerprint via `keytool -printcert -jarfile`, and that
   the app still launches full-screen (asset-link verification passing) on the
   `pme_test` emulator.

## Alternatives considered

**Ask GitHub Support to garbage-collect unreachable objects.** This is the
documented route for secret removal, and it is the only thing that actually
deletes the blob. Rejected as the primary remedy because it depends on GitHub
acting, on their timeline — and critically, we verified that after the
force-push the file was *still* being served:
`raw/ee13456/PradhanMantri%20-%20Google%20Play%20package.zip` returned HTTP 200
with all 5,294,959 bytes. Purging history does not make a blob unreachable by
sha. Still worth doing as cleanup, but it cannot be the fix.

**Delete and recreate the repository.** Certain and immediate, but costs the
repo's history-on-GitHub and metadata, and briefly takes down GitHub Pages
until `mobile/main` is re-pushed and the custom domain re-pointed.
Disproportionate given rotation solves the actual exposure.

**Accept the risk.** Initially judged reasonable — roughly a six-hour window on
an obscure project — and that reasoning was sound for a window that had
*closed*. It hadn't: the file was still live at the moment of assessment, and
public pushes are indexed by bots that clone from GitHub's event firehose.

**Rotate later, after publishing to Play.** Rejected on cost. Nothing depended
on the old key yet: no Play listing, no users, one emulator install. Once
published, the key becomes load-bearing and rotation means negotiating with
Google's upload-key reset process instead of running `keytool`.

## Consequences

**Rotation is the only remedy fully under our control.** It works even if
someone already downloaded the file, because it withdraws the thing that gave
the key its power — the domain's endorsement. An APK signed with the old key now
fails Digital Asset Links verification and opens with the address bar visible,
which is exactly what makes a fake app look fake.

**The leaked blob is still downloadable from GitHub** and will be until GitHub
GCs it. Accepted: it is now inert.

**A new single point of failure.** `D:\keys\pme-release.keystore` is
unrecoverable if lost, and losing it after publishing means never being able to
update the Play listing. Mitigation: the keystore file and its password are
backed up separately — the file is already encrypted by that password, so
storing them in different places means neither location alone is sufficient.

**Accept Play App Signing at upload time.** Google then holds the real signing
key and ours becomes an *upload* key, which Support can reset if it is ever lost
or leaked again. That is strictly better than today's position, where
`D:\keys\` is the only copy of something irreplaceable.

**Operational rules now in CLAUDE.md**: store packages live in `D:\keys\`, never
the working tree or its parent; and verify with `git ls-files`, not `git status`
or `git check-ignore`, before trusting an ignore rule on sensitive material.

**Passwords are generated alphanumeric-only.** Shell metacharacters break
`apksigner.bat` argument parsing (`Unexpected parameter(s) after input APK`).
Related: PKCS12 keystores use one password for both store and key, so
`keytool -keypasswd` is unsupported on them and `-storepasswd` rotates both.
