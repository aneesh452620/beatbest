import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

test('the product scene renders its canvas and loading preview without crashing', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: ProductScene } = await server.ssrLoadModule('/src/ProductScene.jsx');
    const html = renderToString(React.createElement(ProductScene));
    assert.match(html, /<canvas/);
    assert.match(html, /Preparing your perspective/);
    assert.match(html, /Beatbest 01 headphones in Chalk/);
  } finally {
    await server.close();
  }
});
