/* Shared, deterministic demo logic. No network or browser storage. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IntegrationLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  function leadBatch(rows) {
    if (!Array.isArray(rows) || rows.length > 1000) throw new Error('INVALID_BATCH');
    const seen = new Set();
    return rows.map((row, index) => {
      const id = `L-${String(index + 1).padStart(3, '0')}`;
      if (!row || typeof row !== 'object') return {id, status: 'invalid', reason: 'INVALID_ROW'};
      const name = String(row.name || '').trim().slice(0, 120);
      const email = String(row.email || '').trim().toLowerCase();
      const request = String(row.request || '').trim().slice(0, 1000);
      const budget = typeof row.budget === 'number' ? row.budget : NaN;
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !request || !Number.isSafeInteger(budget) || budget < 0) {
        return {id, name, status: 'invalid', reason: 'CHECK_FIELDS'};
      }
      // Same contact and same request in one batch. Separate requests are retained.
      const key = JSON.stringify([email, request.toLowerCase().replace(/\s+/g, ' ')]);
      if (seen.has(key)) return {id, name, email, status: 'duplicate', reason: 'SAME_REQUEST'};
      seen.add(key);
      const priority = budget >= 30000 ? 'high' : 'normal';
      return {id, name, email, request, budget, priority, status: 'accepted',
        crmDraft: {externalId: id, contact: {name, email}, title: request, budget, stage: 'new', priority},
        notificationDraft: `${id} · ${name} · ${budget} RUB · ${request}`};
    });
  }
  function syncCatalog(current, payload) {
    if (!payload || !Number.isSafeInteger(payload.revision) || payload.revision < 1 || !Array.isArray(payload.items) || payload.items.length > 1000) throw new Error('INVALID_CATALOG');
    if (payload.revision <= current.revision) return {state: current, status: 'unchanged', count: 0};
    const catalog = Object.create(null);
    for (const p of payload.items) {
      if (!p || typeof p.sku !== 'string' || !/^[A-Za-z0-9-]{1,32}$/.test(p.sku) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 120 || !Number.isSafeInteger(p.priceMinor) || p.priceMinor < 0 || p.priceMinor > 100000000 || !Number.isSafeInteger(p.stock) || p.stock < 0 || p.stock > 1000000 || Object.hasOwn(catalog, p.sku)) throw new Error('INVALID_PRODUCT');
      catalog[p.sku] = {...p};
    }
    // A fresh snapshot carries physical stock. Open demo reservations are subtracted.
    for (const order of Object.values(current.orders)) for (const line of order.lines) {
      if (!catalog[line.sku] || catalog[line.sku].stock < line.qty) throw new Error('RESERVATION_CONFLICT');
      catalog[line.sku].stock -= line.qty;
    }
    return {state: {...current, revision: payload.revision, catalog}, status: 'updated', count: payload.items.length};
  }
  function importOrder(current, order) {
    if (!order || typeof order.id !== 'string' || !/^[A-Za-z0-9-]{1,40}$/.test(order.id) || !Array.isArray(order.lines) || !order.lines.length || order.lines.length > 100) throw new Error('INVALID_ORDER');
    const quantities = new Map();
    for (const line of order.lines) {
      if (!line || typeof line.sku !== 'string' || !Number.isSafeInteger(line.qty) || line.qty < 1 || line.qty > 1000000) throw new Error('INVALID_QUANTITY');
      const qty = (quantities.get(line.sku) || 0) + line.qty;
      if (!Number.isSafeInteger(qty)) throw new Error('INVALID_QUANTITY');
      quantities.set(line.sku, qty);
    }
    const normalized = Array.from(quantities, ([sku, qty]) => ({sku, qty})).sort((a, b) => a.sku.localeCompare(b.sku));
    const signature = JSON.stringify(normalized);
    if (Object.hasOwn(current.orders, order.id)) {
      if (current.orders[order.id].signature !== signature) throw new Error('ID_CONFLICT');
      return {state: current, status: 'duplicate', order: current.orders[order.id]};
    }
    const catalog = Object.fromEntries(Object.entries(current.catalog).map(([sku, p]) => [sku, {...p}]));
    let totalMinor = 0;
    for (const line of normalized) {
      const p = catalog[line.sku];
      if (!Object.hasOwn(catalog, line.sku)) throw new Error('UNKNOWN_SKU');
      if (line.qty > p.stock) throw new Error('OUT_OF_STOCK');
      totalMinor += p.priceMinor * line.qty;
      if (!Number.isSafeInteger(totalMinor)) throw new Error('AMOUNT_OVERFLOW');
      p.stock -= line.qty;
    }
    const saved = {id: order.id, lines: normalized, totalMinor, signature};
    return {state: {...current, catalog, orders: {...current.orders, [order.id]: saved}}, status: 'created', order: saved};
  }
  function initialState() { return {revision: 0, catalog: {}, orders: {}}; }
  return {leadBatch, syncCatalog, importOrder, initialState};
});
