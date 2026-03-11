import fs from "fs";
import os from "os";
import { useState } from "react";

import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import YAML from "yaml";

interface Bookmark {
  title: string;
  url: string;
}

interface Config {
  bookmarks: Bookmark[];
}

function expandPath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return filePath.replace("~", os.homedir());
  }
  return filePath;
}

function readConfigFile(configPath: string): string {
  const resolvedPath = expandPath(configPath);
  return fs.readFileSync(resolvedPath, "utf-8");
}

function loadBookmarks(configPath: string): { bookmarks: Bookmark[]; error?: string } {
  try {
    const content = readConfigFile(configPath);
    const config = YAML.parse(content) as Config;

    if (!config || !Array.isArray(config.bookmarks)) {
      return { bookmarks: [], error: "Invalid config: 'bookmarks' array not found" };
    }

    const valid = config.bookmarks.filter((b) => b.title && b.url);
    return { bookmarks: valid };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { bookmarks: [], error: message };
  }
}

function saveBookmarkEdit(
  configPath: string,
  oldBookmark: Bookmark,
  newBookmark: Bookmark,
): { success: boolean; error?: string } {
  try {
    const resolvedPath = expandPath(configPath);
    const content = readConfigFile(configPath);
    const doc = YAML.parseDocument(content);

    const bookmarks = doc.get("bookmarks") as YAML.YAMLSeq;
    if (!bookmarks || !YAML.isSeq(bookmarks)) {
      return { success: false, error: "Invalid config: 'bookmarks' array not found" };
    }

    let found = false;
    for (const item of bookmarks.items) {
      if (!YAML.isMap(item)) continue;
      const title = item.get("title");
      const url = item.get("url");
      if (title === oldBookmark.title && url === oldBookmark.url) {
        item.set("title", newBookmark.title);
        item.set("url", newBookmark.url);
        found = true;
        break;
      }
    }

    if (!found) {
      return { success: false, error: "Could not find bookmark in config file" };
    }

    fs.writeFileSync(resolvedPath, doc.toString(), "utf-8");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

function EditBookmarkForm(props: { bookmark: Bookmark; configPath: string; onEdit: () => void }) {
  const { pop } = useNavigation();
  const { bookmark, configPath, onEdit } = props;

  async function handleSubmit(values: { title: string; url: string }) {
    if (!values.title.trim() || !values.url.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Title and URL are required" });
      return;
    }

    const result = saveBookmarkEdit(configPath, bookmark, {
      title: values.title.trim(),
      url: values.url.trim(),
    });

    if (result.success) {
      await showToast({ style: Toast.Style.Success, title: "Bookmark updated" });
      onEdit();
      pop();
    } else {
      await showToast({ style: Toast.Style.Failure, title: "Failed to update bookmark", message: result.error });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Changes" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={bookmark.title} />
      <Form.TextField id="url" title="URL" defaultValue={bookmark.url} />
    </Form>
  );
}

export default function Command() {
  const { configPath } = getPreferenceValues<Preferences>();

  const [{ bookmarks, error }, setState] = useState(() => loadBookmarks(configPath));

  if (error) {
    void showToast({ style: Toast.Style.Failure, title: "Failed to load bookmarks", message: error });
  }

  function reloadBookmarks() {
    setState(loadBookmarks(configPath));
  }

  return (
    <List searchBarPlaceholder="Search bookmarks..." throttle>
      <List.EmptyView
        title={error ? "Failed to load bookmarks" : "No bookmarks found"}
        description={error || "Add bookmarks to your config.yaml file to get started."}
      />
      {bookmarks.map((bookmark, index) => (
        <List.Item
          key={`${bookmark.title}-${index}`}
          title={bookmark.title}
          subtitle={bookmark.url}
          icon={getFavicon(bookmark.url)}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={bookmark.url} />
              <Action.CopyToClipboard title="Copy URL" content={bookmark.url} />
              <Action.Push
                title="Edit Bookmark"
                icon={Icon.Pencil}
                shortcut={{ modifiers: ["cmd"], key: "e" }}
                target={<EditBookmarkForm bookmark={bookmark} configPath={configPath} onEdit={reloadBookmarks} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
