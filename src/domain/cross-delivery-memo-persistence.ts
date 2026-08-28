import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { OwnerAuthorityFact } from "./authority.js";
import {
  createMemoRecord,
  dismissMemoRecord,
  isProjectMemosDocument,
  promoteMemoRecord,
  type CreateMemoInput,
  type MemoPromotionTarget,
  type ProjectMemo,
  type ProjectMemosDocument,
} from "./cross-delivery-memo.js";
import { isSemanticId } from "./identity.js";

export const MEMOS_RELATIVE_PATH = path.join(".flowkit", "memos.json");
const EMPTY_MEMOS_DOCUMENT: ProjectMemosDocument = {
  formatVersion: 1,
  memos: [],
};
let tempSequence = 0;

function memosPath(repositoryRoot: string): string {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new Error("Invalid repository root");
  }
  return path.join(repositoryRoot, MEMOS_RELATIVE_PATH);
}

function cloneDocument(document: ProjectMemosDocument): ProjectMemosDocument {
  return JSON.parse(JSON.stringify(document)) as ProjectMemosDocument;
}

export async function readMemos(
  repositoryRoot: string,
): Promise<ProjectMemosDocument> {
  const target = memosPath(repositoryRoot);
  let text: string;
  try {
    text = await readFile(target, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return cloneDocument(EMPTY_MEMOS_DOCUMENT);
    }
    throw error;
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Invalid Memo document JSON");
  }
  if (!isProjectMemosDocument(value)) {
    throw new Error("Invalid Memo document");
  }
  return value;
}

export async function getMemo(
  repositoryRoot: string,
  memoId: string,
): Promise<ProjectMemo | null> {
  if (!isSemanticId(memoId)) return null;
  const document = await readMemos(repositoryRoot);
  return document.memos.find((memo) => memo.memoId === memoId) ?? null;
}

export async function listOpenMemos(
  repositoryRoot: string,
): Promise<readonly ProjectMemo[]> {
  const document = await readMemos(repositoryRoot);
  return document.memos.filter((memo) => memo.state === "open");
}

async function replaceDocument(
  repositoryRoot: string,
  document: ProjectMemosDocument,
): Promise<void> {
  if (!isProjectMemosDocument(document)) {
    throw new Error("Refusing to persist invalid Memo document");
  }
  const target = memosPath(repositoryRoot);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.${++tempSequence}.tmp`;
  const serialized = `${JSON.stringify(document, null, 2)}\n`;
  try {
    await writeFile(temp, serialized, { encoding: "utf8", flag: "wx" });
    await rename(temp, target);
  } finally {
    await rm(temp, { force: true }).catch(() => undefined);
  }
}

function withSortedMemos(memos: readonly ProjectMemo[]): ProjectMemosDocument {
  return {
    formatVersion: 1,
    memos: [...memos].sort((a, b) =>
      a.memoId < b.memoId ? -1 : a.memoId > b.memoId ? 1 : 0,
    ),
  };
}

export async function createMemo(
  repositoryRoot: string,
  input: CreateMemoInput,
  authority: OwnerAuthorityFact,
): Promise<ProjectMemo> {
  const current = await readMemos(repositoryRoot);
  if (current.memos.some((memo) => memo.memoId === input.memoId)) {
    throw new Error(`Memo already exists: ${input.memoId}`);
  }
  const created = createMemoRecord(input, authority);
  if (created === null) throw new Error("Memo create authority rejected");
  await replaceDocument(
    repositoryRoot,
    withSortedMemos([...current.memos, created]),
  );
  return created;
}

export async function promoteMemo(
  repositoryRoot: string,
  memoId: string,
  target: MemoPromotionTarget,
  authority: OwnerAuthorityFact,
): Promise<ProjectMemo> {
  const current = await readMemos(repositoryRoot);
  const index = current.memos.findIndex((memo) => memo.memoId === memoId);
  if (index < 0) throw new Error(`Memo not found: ${memoId}`);
  const promoted = promoteMemoRecord(current.memos[index], target, authority);
  if (promoted === null) throw new Error("Memo promote rejected");
  const next = [...current.memos];
  next[index] = promoted;
  await replaceDocument(repositoryRoot, withSortedMemos(next));
  return promoted;
}

export async function dismissMemo(
  repositoryRoot: string,
  memoId: string,
  authority: OwnerAuthorityFact,
): Promise<ProjectMemo> {
  const current = await readMemos(repositoryRoot);
  const index = current.memos.findIndex((memo) => memo.memoId === memoId);
  if (index < 0) throw new Error(`Memo not found: ${memoId}`);
  const dismissed = dismissMemoRecord(current.memos[index], authority);
  if (dismissed === null) throw new Error("Memo dismiss rejected");
  const next = [...current.memos];
  next[index] = dismissed;
  await replaceDocument(repositoryRoot, withSortedMemos(next));
  return dismissed;
}
