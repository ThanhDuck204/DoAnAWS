/**
 * MockUserRepository — in-memory mock implementation
 *
 * Uses seed data from @/data/seed/users
 */

import { mockUsers } from '@/data/seed/users';

const DELAY_MS = 30;
const STORAGE_KEY = 'meetingAppMockUsers';
const delay = (ms = DELAY_MS) => new Promise((r) => setTimeout(r, ms));

let store = null;

function cloneUsers(users) {
  return users.map((user) => ({ ...user }));
}

function readPersistedStore() {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistStore() {
  if (typeof window === 'undefined' || !store) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Mock persistence should never block auth flows.
  }
}

function getStore() {
  if (!store) store = readPersistedStore() || cloneUsers(mockUsers);
  return store;
}

export async function findById(id) {
  await delay();
  return getStore().find((u) => u.id === id) || null;
}

export async function findByEmail(email) {
  await delay();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return getStore().find((u) => String(u.email || '').toLowerCase() === normalizedEmail) || null;
}

export async function findAll() {
  await delay();
  return [...getStore()];
}

export async function create(data) {
  await delay();
  const now = new Date().toISOString();
  const user = {
    id: data.id || 'user-' + Date.now().toString(36),
    name: data.name || '',
    email: data.email || '',
    password: data.password || '123456',
    avatar: data.avatar || null,
    phone: data.phone || '',
    avatarHistory: data.avatarHistory || [],
    role: data.role || 'EMPLOYEE',
    departmentId: data.departmentId || null,
    createdAt: data.createdAt || now,
  };
  getStore().push(user);
  persistStore();
  return { ...user };
}

export async function update(id, data) {
  await delay();
  const store = getStore();
  const idx = store.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store[idx] = { ...store[idx], ...data };
  persistStore();
  return { ...store[idx] };
}

export async function delete_(id) {
  await delay();
  const store = getStore();
  const idx = store.findIndex((u) => u.id === id);
  if (idx !== -1) {
    store.splice(idx, 1);
    persistStore();
  }
}

export default { findById, findByEmail, findAll, create, update, delete_ };
