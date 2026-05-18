# Local EAS build scripts (CusOwn Mobile)

Run all commands from the **project root** (`CusOwn-Mobile/`).

First-time setup (once per machine):

```bash
chmod +x scripts/build-local-android.sh scripts/build-local-ios.sh
```

Valid **`eas.json` profiles** (do **not** use `--profile android` — that profile does not exist):

| Profile       | Use case                                       | Env file loaded by scripts |
| ------------- | ---------------------------------------------- | -------------------------- |
| `preview`     | **Default** — internal APK/IPA, Android APK    | `.env.local`               |
| `production`  | Store / release-style build                    | `.env.production`          |
| `development` | Dev client (needs Metro; not a standalone APK) | `.env.local`               |

---

## Android APK (recommended commands)

**Fast local APK** (default: `preview`, `.env.local`, Gradle cache, pinned EAS CLI ≥ 18.12.3):

```bash
./scripts/build-local-android.sh
```

**Verbose prerequisite checks** (slower start, same build):

```bash
./scripts/build-local-android.sh --full-checks
```

**Production APK** (loads `.env.production`):

```bash
./scripts/build-local-android.sh production
```

**Check machine only** (no build):

```bash
./scripts/build-local-android.sh --check-only
```

**If a build is broken / stale** (much slower — clears EAS cache):

```bash
./scripts/build-local-android.sh --clean-cache
```

**Dev client** (not a standalone preview APK):

```bash
./scripts/build-local-android.sh development
```

After build, install on a device:

```bash
adb install -r build-*.apk
```

---

## iOS IPA

**Fast local IPA** (`preview`, `.env.local`):

```bash
./scripts/build-local-ios.sh
```

**Production IPA** (`.env.production`):

```bash
./scripts/build-local-ios.sh production
```

**Prerequisites only**:

```bash
./scripts/build-local-ios.sh --check-only
```

**Clean cache** (slow, troubleshooting):

```bash
./scripts/build-local-ios.sh --clean-cache
```

---

## Raw EAS commands (if you skip the scripts)

Scripts pin **`eas-cli@>=18.12.3`** to match `eas.json`. If you run EAS yourself, use the same pin or you may see:

```text
You are on eas-cli@16.x which does not satisfy the CLI version constraint (>= 18.12.3)
```

**Correct Android APK build** (preview, local):

```bash
set -a && source .env.local && set +a
export EXPO_NO_DOTENV=1
npx --yes eas-cli@">=18.12.3" build -p android --profile preview --local --non-interactive
```

**Wrong** (invalid profile name):

```bash
npx eas-cli build -p android --profile android --local
```

---

## Environment files

| Build type                              | File loaded by script |
| --------------------------------------- | --------------------- |
| `./scripts/build-local-*.sh`            | `.env.local`          |
| `./scripts/build-local-*.sh production` | `.env.production`     |

Scripts set `EXPO_NO_DOTENV=1` after sourcing so Expo does not load a different env file during the build.

Put **`EXPO_PUBLIC_SUPABASE_URL`**, **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**, Google client IDs, etc. in the file that matches the profile you build.

---

## Speed tips

1. Default script mode is **fast** (minimal checks; Gradle daemon + cache). Use **`--full-checks`** when setting up a new Mac.
2. Avoid **`--clean-cache`** unless debugging a bad cache.
3. Second and later builds are usually much faster than the first (Gradle + npm caches).
4. **`preview`** builds an **APK** per `eas.json` (`android.buildType: apk`). **`production`** may use AAB for Play — check EAS output.
5. For quick JS-only iteration, use **`npx expo start`** + dev client (`development` profile), not a full local EAS build every time.

---

## Razorpay

Both platforms use **`react-native-razorpay`** (native module). Local EAS builds compile it into the binary; Expo Go cannot test Razorpay payments.

---

## Output artifacts

EAS prints the final path. Often in the project root:

- Android: `build-*.apk`
- iOS: `build-*.ipa`

---

## Troubleshooting

| Problem                    | What to do                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| eas-cli version error      | Use scripts, or `npx --yes eas-cli@">=18.12.3" build ...`         |
| Invalid profile `android`  | Use `preview` or `production`                                     |
| Missing env at runtime     | Ensure `.env.local` or `.env.production` has `EXPO_PUBLIC_*` vars |
| Build very slow first time | Normal; use `--fast` on rebuilds                                  |
| Build fails after upgrade  | Try once with `--clean-cache`                                     |
