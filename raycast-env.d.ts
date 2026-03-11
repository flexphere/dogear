/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Config File Path - Path to config.yaml containing bookmarks */
  "configPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-bookmarks` command */
  export type SearchBookmarks = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-bookmarks` command */
  export type SearchBookmarks = {}
}

