/**
 * MockWorkspaceRepository — mock implementation
 *
 * Persists to localStorage to survive server restarts.
 * Falls back to seed data from @/data/seed/workspaces on first load.
 */

import { workspaces as seedWorkspaces, userWorkspaces as seedUserWorkspaces } from '@/data/seed/workspaces';
import { DEFAULT_FEATURES } from '@/data/defaults/features';

const DELAY_MS = 20;
const STORAGE_KEY = 'meetingAppMockWorkspaces';
const delay = (ms = DELAY_MS) => new Promise((r) => setTimeout(r, ms));

let store = null;

function readPersistedStore() {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function persistStore() {
  if (typeof window === 'undefined' || !store) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Swallow — persistence should never block operations.
  }
}

function getStore() {
  if (!store) {
    store = readPersistedStore();
    if (!store) {
      store = seedWorkspaces.map((ws) => ({ ...ws, channels: [...ws.channels], teams: [...ws.teams], members: [...ws.members] }));
    }
  }
  return store;
}

function cloneWorkspace(ws) {
  return JSON.parse(JSON.stringify(ws));
}

export async function findById(id) {
  await delay();
  const ws = getStore().find((w) => w.id === id);
  return ws ? cloneWorkspace(ws) : null;
}

export async function findByUserId(userId) {
  await delay();
  // Match by membership in persisted data, fall back to seed mapping
  const all = getStore();
  const seedIds = seedUserWorkspaces[userId] || [];
  return all
    .filter((ws) => seedIds.includes(ws.id) || ws.members?.some((m) => m.userId === userId))
    .map(cloneWorkspace);
}

export async function findAll() {
  await delay();
  return getStore().map(cloneWorkspace);
}

export async function create(data) {
  await delay();
  const now = new Date().toISOString();
  const ws = {
    id: data.id,
    name: data.name || '',
    description: data.description || '',
    iconColor: data.iconColor || 'blue',
    workspaceType: data.workspaceType || 'blank',
    visibility: data.visibility || 'private',
    slug: data.slug || '',
    ownerId: data.ownerId || '',
    memberIds: data.memberIds || [],
    channels: data.channels || [],
    teams: data.teams || [],
    members: data.members || [],
    tasks: data.tasks || [],
    meetings: data.meetings || [],
    messages: data.messages || {},
    notifications: data.notifications || [],
    invitations: data.invitations || [],
    voiceRecords: data.voiceRecords || [],
    customRoles: data.customRoles || [],
    features: data.features || DEFAULT_FEATURES.map((f) => ({ ...f })),
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
  getStore().push(ws);
  persistStore();
  return cloneWorkspace(ws);
}

export async function update(id, data) {
  await delay();
  const s = getStore();
  const idx = s.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  s[idx] = { ...s[idx], ...data, updatedAt: now };
  persistStore();
  return cloneWorkspace(s[idx]);
}

export async function delete_(id) {
  await delay();
  const s = getStore();
  const idx = s.findIndex((w) => w.id === id);
  if (idx !== -1) s.splice(idx, 1);
  persistStore();
}

export default { findById, findByUserId, findAll, create, update, delete_ };
