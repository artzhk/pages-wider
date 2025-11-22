const assert = require('node:assert');
const { test, beforeEach } = require('node:test');

let storageData;

const createChromeStub = () => {
  storageData = {};

  const noOp = async () => {};
  const event = { addListener: () => {} };

  global.chrome = {
    runtime: {
      onMessage: event,
      onInstalled: event,
    },
    storage: {
      sync: {
        get: async () => storageData,
        set: async (value) => {
          storageData = { ...storageData, ...value };
        },
      },
    },
    scripting: {
      executeScript: noOp,
    },
    action: {
      setBadgeText: noOp,
      setBadgeBackgroundColor: noOp,
      onClicked: event,
    },
    tabs: {
      get: async () => ({ id: 1, url: 'https://example.com' }),
      query: async () => [{ id: 1, url: 'https://example.com' }],
      onUpdated: event,
      onActivated: event,
    },
    commands: {
      onCommand: event,
    },
  };
};

createChromeStub();
const {
  getHostname,
  normalizeDomain,
  isHttpUrl,
  loadSettings,
  DEFAULT_SETTINGS,
} = require('../background.js');

beforeEach(() => {
  storageData = {};
});

test('getHostname returns hostnames and null for invalid URLs', () => {
  assert.strictEqual(getHostname('https://sub.example.com/page'), 'sub.example.com');
  assert.strictEqual(getHostname('notaurl'), null);
});

test('normalizeDomain strips www prefix', () => {
  assert.strictEqual(normalizeDomain('www.example.com'), 'example.com');
  assert.strictEqual(normalizeDomain('blog.example.com'), 'blog.example.com');
  assert.strictEqual(normalizeDomain(null), null);
});

test('isHttpUrl only allows http and https', () => {
  assert.strictEqual(isHttpUrl('https://example.com'), true);
  assert.strictEqual(isHttpUrl('http://example.com'), true);
  assert.strictEqual(isHttpUrl('file://example.com'), false);
  assert.strictEqual(isHttpUrl('notaurl'), false);
});

test('loadSettings merges stored values with defaults', async () => {
  storageData = { alwaysOn: true, sites: { 'example.com': true }, activationShortcut: 'Ctrl+Shift+Y' };
  const settings = await loadSettings();

  assert.deepStrictEqual(settings, {
    ...DEFAULT_SETTINGS,
    alwaysOn: true,
    sites: { 'example.com': true },
    activationShortcut: 'Ctrl+Shift+Y',
  });
});

test('loadSettings falls back to defaults when storage is empty', async () => {
  const settings = await loadSettings();
  assert.deepStrictEqual(settings, DEFAULT_SETTINGS);
});
