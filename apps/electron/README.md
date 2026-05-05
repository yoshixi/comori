# electron

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### macOS signing/notarization

The macOS build uses hardened runtime and notarization (`notarize: true` in `electron-builder.yml`).
[electron-builder](https://www.electron.build/mac.html) runs notarization via `@electron/notarize`.
This is separate from Electron Forge, but the credential model is the same: use an **App Store Connect API key**
(recommended) or an Apple ID app-specific password.

**Notarization — App Store Connect API key (recommended)**

Create a key in [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api)
(with at least Developer access). Download the `.p8` once, note the Key ID and Issuer ID, then:

```bash
export APPLE_API_KEY="/absolute/path/to/AuthKey_XXXXXXXXXX.p8"
export APPLE_API_KEY_ID="XXXXXXXXXX"
export APPLE_API_ISSUER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Notarization — Apple ID + app-specific password (alternative)**

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"
```

For signing, provide either:

```bash
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
```

or a certificate file and password:

```bash
export CSC_LINK="file:///path/to/DeveloperID.p12"
export CSC_KEY_PASSWORD="your-p12-password"
```
