const test = require('node:test');
const assert = require('node:assert/strict');
const Wax = require('./wax.js');

const rec = (snowTemp, extra = {}) =>
  Wax.recommend({ snowType: 'neu', precip: 'keiner', snowTemp, ...extra });

test('Stufen nach Katalog: Blau -25..-10, Violett -12..-4, Rot -5..0, Gelb -2..10', () => {
  assert.equal(rec(-25).color, 'blau');
  assert.equal(rec(-15).color, 'blau');
  assert.equal(rec(-8).color, 'violett');
  assert.equal(rec(-3).color, 'rot');
  assert.equal(rec(-1.5).color, 'rot');
  assert.equal(rec(3).color, 'gelb');
  assert.equal(rec(10).color, 'gelb');
});

test('Überlappung: die Stufe, deren Mitte der Temperatur am nächsten liegt', () => {
  assert.equal(Wax.pickClass(-11).id, 'violett'); // Blau-Mitte -17.5, Violett-Mitte -8
  assert.equal(Wax.pickClass(-4.5).id, 'rot'); // Violett-Mitte -8, Rot-Mitte -2.5
  assert.equal(Wax.pickClass(-1).id, 'rot'); // Rot-Mitte -2.5, Gelb-Mitte 4
});

test('Ausserhalb des Katalogs: nächste Stufe und Hinweis', () => {
  const r = rec(-30);
  assert.equal(r.color, 'blau');
  assert.ok(r.notes.some((n) => n.includes('ausserhalb des Katalogs')));
});

test('Lufttemperatur plus Himmel ergibt die geschätzte Schneetemperatur', () => {
  assert.equal(Wax.estimateSnowTemp(-6, 'sonnig'), -6);
  assert.equal(Wax.estimateSnowTemp(-6, 'bewoelkt'), -7);
  assert.equal(Wax.estimateSnowTemp(-6, 'klar'), -9);
  const r = Wax.recommend({ snowType: 'neu', precip: 'keiner', airTemp: -6, sky: 'klar' });
  assert.equal(r.snowTemp, -9);
  assert.ok(r.notes.some((n) => n.includes('geschätzt')));
});

test('Neuschnee trocken: LMrace, nass: HMrace', () => {
  assert.ok(rec(-8).products.includes('LMrace Purple'));
  assert.ok(rec(-8, { moisture: 'nass' }).products.includes('HMrace Purple'));
});

test('Neuschnee nass in Rot und Gelb: kein HMrace im Chart, LMrace als Ersatz mit Hinweis', () => {
  const r = rec(-3, { moisture: 'nass' });
  assert.ok(r.products.includes('LMrace Red'));
  assert.ok(r.notes.some((n) => n.includes('kein HMrace')));
});

test('Altschnee trocken im Blau-Bereich: kein LMrace im Chart, HMrace als Ersatz', () => {
  const r = Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: -15, moisture: 'trocken' });
  assert.ok(r.products.includes('HMrace Blue'));
  assert.ok(r.notes.some((n) => n.includes('kein LMrace')));
});

test('Kunstschnee: Moly in beiden Feuchten', () => {
  const dry = Wax.recommend({ snowType: 'kunst', precip: 'keiner', snowTemp: -8, moisture: 'trocken' });
  const wet = Wax.recommend({ snowType: 'kunst', precip: 'keiner', snowTemp: -8, moisture: 'nass' });
  assert.ok(dry.products.includes('LMrace Purple Moly'));
  assert.ok(wet.products.includes('HMrace Purple Moly'));
  assert.equal(dry.moly, true);
  assert.ok(dry.products.includes('Race Propulsor Blue Moly'));
});

test('Moly nicht bei Alt- und Neuschnee im Chart', () => {
  assert.ok(!rec(-8).products.some((p) => p.includes('Moly')));
  assert.equal(Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: -8, moisture: 'trocken' }).moly, false);
});

test('Feuchte-Auto: Regen und Schnee ab -1 °C gelten als nass, manuelle Wahl schlägt die Automatik', () => {
  assert.equal(rec(-8, { precip: 'regen' }).moisture, 'nass');
  assert.equal(rec(-0.5).moisture, 'nass');
  assert.equal(rec(-8).moisture, 'trocken');
  assert.equal(rec(-0.5, { moisture: 'trocken' }).moisture, 'trocken');
});

test('Propulsor nur im Katalog-Bereich', () => {
  assert.ok(rec(-8).products.includes('Race Propulsor Blue'));
  assert.ok(rec(-2).products.includes('Race Propulsor Yellow'));
  assert.ok(!rec(-15).products.some((p) => p.includes('Propulsor')));
  assert.ok(!rec(3).products.some((p) => p.includes('Propulsor')));
});

test('Finish nach Katalog', () => {
  assert.match(Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: -8 }).finish, /Fine Steel/);
  assert.match(rec(-8).finish, /Fleece/);
  assert.match(Wax.recommend({ snowType: 'kunst', precip: 'keiner', snowTemp: -8 }).finish, /Fine Steel/);
});

test('Mischung: Graphit bei Kunst- oder Frühlingsschnee, nie bei Neuschnee', () => {
  assert.equal(Wax.recommend({ snowType: 'kunst', precip: 'keiner', snowTemp: -8 }).compose.needed, true);
  assert.equal(Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: 0 }).compose.needed, true);
  assert.equal(rec(-8).compose.needed, false);
  assert.equal(rec(-8, { precip: 'schnee' }).compose.needed, false);
});

test('Ungültige Eingaben werfen einen Fehler', () => {
  assert.throws(() => Wax.recommend({ snowType: 'nebel', precip: 'keiner', snowTemp: -5 }));
  assert.throws(() => Wax.recommend({ snowType: 'alt', precip: 'hagel', snowTemp: -5 }));
  assert.throws(() => Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: -5, moisture: 'matsch' }));
  assert.throws(() => Wax.recommend({ snowType: 'alt', precip: 'keiner', airTemp: 'kalt', sky: 'sonnig' }));
  assert.throws(() => Wax.recommend({ snowType: 'alt', precip: 'keiner', airTemp: -5, sky: 'nebel' }));
  assert.throws(() => Wax.recommend({ snowType: 'alt', precip: 'keiner', snowTemp: 25 }));
});

test('Vier Wachsarten: Race, Flüssigwachs, Base, Fishscale', () => {
  const r = Wax.recommend({ snowType: 'neu', precip: 'keiner', snowTemp: -8 });
  assert.deepEqual(r.types.race, ['LMrace Purple', 'Race Propulsor Blue']);
  assert.equal(r.types.liquid, 'MX-E Violett flüssig');
  assert.equal(r.types.base.product, 'Medium Base');
  assert.equal(r.types.fishscale, null);
});

test('Base: Graphit bei Kunstschnee, VRB bei sehr kalt und trocken', () => {
  assert.equal(Wax.recommend({ snowType: 'kunst', precip: 'keiner', snowTemp: -8 }).types.base.product, 'Graphite Base');
  assert.equal(Wax.recommend({ snowType: 'neu', precip: 'keiner', snowTemp: -18, moisture: 'trocken' }).types.base.product, 'VRB Base');
  assert.equal(Wax.recommend({ snowType: 'neu', precip: 'keiner', snowTemp: -18, moisture: 'nass' }).types.base.product, 'Medium Base');
});
