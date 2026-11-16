// Wachs-Logik nach der Auswahlhilfe "Race" im Vola-Katalog 2025-26 (Seite 16).
// Ablauf wie im Katalog: Schneetyp, trocken oder nass, Temperatur.
// Stufen-Grenzen stehen im Katalog. Wo sich zwei Stufen überlappen, nimmt die App
// die Stufe, deren Mitte der Temperatur am nächsten liegt. Der Katalog sagt dazu nichts.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Wax = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const CLASSES = [
    { id: 'blau', name: 'Blau', min: -25, max: -10, text: 'Kalter, trockener Schnee.' },
    { id: 'violett', name: 'Violett', min: -12, max: -4, text: 'Mittelkalter Schnee, die Standardstufe für viele Tage im Winter.' },
    { id: 'rot', name: 'Rot', min: -5, max: 0, text: 'Leicht frostiger Schnee, typisch für Frühling und Tauwetter.' },
    { id: 'gelb', name: 'Gelb', min: -2, max: 10, text: 'Nasser, warmer Schnee um den Gefrierpunkt.' },
  ];

  // Race-Auswahl laut Chart: [Schneetyp][Feuchte][Stufe] -> Produkt.
  // null: der Chart zeigt für diese Kombination kein Produkt.
  const RACE = {
    neu: {
      trocken: { blau: 'LMrace Blue', violett: 'LMrace Purple', rot: 'LMrace Red', gelb: 'LMrace Yellow' },
      nass: { blau: 'HMrace Blue', violett: 'HMrace Purple', rot: null, gelb: null },
    },
    alt: {
      trocken: { blau: null, violett: 'LMrace Purple', rot: 'LMrace Red', gelb: 'LMrace Yellow' },
      nass: { blau: 'HMrace Blue', violett: 'HMrace Purple', rot: 'HMrace Red', gelb: 'HMrace Yellow' },
    },
    kunst: {
      trocken: { blau: 'LMrace Blue Moly', violett: 'LMrace Purple Moly', rot: 'LMrace Red Moly', gelb: 'LMrace Yellow Moly' },
      nass: { blau: 'HMrace Blue Moly', violett: 'HMrace Purple Moly', rot: 'HMrace Red Moly', gelb: 'HMrace Yellow Moly' },
    },
  };

  // Race Propulsor: eigene Temperaturen laut Katalog, Moly für alten und künstlichen Schnee.
  const PROPULSOR = {
    blau: { min: -12, max: -5, name: 'Race Propulsor Blue', moly: 'Race Propulsor Blue Moly' },
    gelb: { min: -5, max: 0, name: 'Race Propulsor Yellow', moly: 'Race Propulsor Yellow Moly' },
  };

  const SNOW_TYPES = ['kunst', 'alt', 'neu'];
  const SNOW_LABEL = { kunst: 'Kunstschnee (Artificial)', alt: 'Altschnee (Old & Transformed)', neu: 'Neuschnee (New)' };
  const PRECIP = ['keiner', 'schnee', 'regen'];
  const PRECIP_LABEL = { keiner: 'kein Niederschlag', schnee: 'Schneefall', regen: 'Regen' };
  const MOISTURE = ['auto', 'trocken', 'nass'];
  const SKY_OFFSET = { sonnig: 0, bewoelkt: -1, klar: -3 };
  const SKY_LABEL = { sonnig: 'sonnig', bewoelkt: 'bewölkt', klar: 'klarer Himmel / Nacht' };

  function isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function estimateSnowTemp(airTemp, sky) {
    if (!isNumber(airTemp)) throw new Error('Lufttemperatur fehlt oder ist keine Zahl.');
    if (!(sky in SKY_OFFSET)) throw new Error('Unbekannte Himmelslage: ' + sky);
    return airTemp + SKY_OFFSET[sky];
  }

  function matchingClasses(temp) {
    return CLASSES.filter((c) => temp >= c.min && temp <= c.max);
  }

  // Bei Überlappung die Stufe, deren Mitte der Temperatur am nächsten liegt.
  function pickClass(temp) {
    const hits = matchingClasses(temp);
    if (hits.length === 0) return null;
    let best = hits[0];
    let bestDist = Infinity;
    hits.forEach(function (c) {
      const dist = Math.abs(temp - (c.min + c.max) / 2);
      if (dist < bestDist) {
        best = c;
        bestDist = dist;
      }
    });
    return best;
  }

  // "auto": nass bei Regen oder Schnee ab -1 °C. Sonst lässt sich die Feuchte im Formular setzen.
  function resolveWet(moisture, precip, temp) {
    if (moisture === 'trocken') return false;
    if (moisture === 'nass') return true;
    return precip === 'regen' || temp >= -1;
  }

  // Produkt laut Chart. Fehlt es für die gewählte Feuchte, nimmt die App das andere und sagt es dazu.
  function pickRace(snowType, wet, cls) {
    const table = RACE[snowType];
    const primary = wet ? table.nass[cls.id] : table.trocken[cls.id];
    if (primary) return { product: primary, note: null };
    const other = wet ? table.trocken[cls.id] : table.nass[cls.id];
    if (other) {
      return {
        product: other,
        note: (wet ? 'Für nass zeigt der Chart hier kein HMrace' : 'Für trocken zeigt der Chart hier kein LMrace') +
          '. Gewählt: ' + other + '.',
      };
    }
    return { product: null, note: 'Der Chart zeigt für diese Kombination kein Produkt.' };
  }

  function pickFinish(snowType, wet, moly) {
    if (moly) return 'Fine Steel (Feinstahl) nach dem Schaben, dann Nylon. Moly braucht die feine Stahlbürste.';
    if (snowType === 'neu' && !wet) return 'Fleece, dann Nylon. Das bringt die Gleitung auf den ersten Kilometern.';
    return 'Fine Steel, dann Nylon. Das hält die Gleitung länger.';
  }

  // Graphit laut Katalog: für abrasiven Schnee, meist mit einer Base gemischt. Nicht auf frischem Schnee.
  function pickCompose(snowType, precip, temp) {
    if (precip === 'schnee' || snowType === 'neu') {
      return { needed: false, text: 'Keine Mischung nötig. Graphit nicht auf frischem oder fallendem Schnee.' };
    }
    if (snowType === 'kunst' || (snowType === 'alt' && temp >= -5)) {
      return {
        needed: true,
        text: 'Graphit-Mischung möglich: Graphit wird laut Katalog meist mit einer Base gemischt. Für abrasiven Schnee (Kunst, Gletscher, Frühling).',
      };
    }
    return { needed: false, text: 'Keine Mischung nötig. Das fertige Wachs reicht.' };
  }

  // Flüssigwachs: MX-E flüssig in der Farbe der Stufe (Katalog, fluorfrei).
  const LIQUID = {
    blau: 'MX-E Blau flüssig',
    violett: 'MX-E Violett flüssig',
    rot: 'MX-E Rot flüssig',
    gelb: 'MX-E Gelb flüssig',
  };

  // Base: die Zuordnung ist eigene Ableitung aus den Katalogbeschreibungen, nicht im Katalog selbst.
  function pickBase(snowType, wet, temp) {
    if (snowType === 'kunst') {
      return { product: 'Graphite Base', iron: '115 °C', why: 'abrasiver Kunstschnee' };
    }
    if (!wet && temp <= -15) {
      return { product: 'VRB Base', iron: '120 °C', why: 'sehr kalt und trocken' };
    }
    return { product: 'Medium Base', iron: '135 °C', why: 'erste Schicht, gute Beschleunigung' };
  }

  // input: { snowType, precip?, moisture? ('auto'|'trocken'|'nass'), snowTemp? | airTemp? + sky? }
  function recommend(input) {
    const snowType = input.snowType;
    if (!SNOW_TYPES.includes(snowType)) throw new Error('Unbekannter Schneetyp: ' + snowType);
    const precip = input.precip || 'keiner';
    if (!PRECIP.includes(precip)) throw new Error('Unbekannter Niederschlag: ' + precip);
    const moisture = input.moisture || 'auto';
    if (!MOISTURE.includes(moisture)) throw new Error('Unbekannte Feuchte: ' + moisture);

    let temp;
    let estimated = false;
    if (isNumber(input.snowTemp)) {
      temp = input.snowTemp;
    } else {
      temp = estimateSnowTemp(input.airTemp, input.sky);
      estimated = true;
    }
    if (temp > 10 || temp < -40) {
      throw new Error('Temperatur ausserhalb des plausiblen Bereichs (-40 bis +10 °C).');
    }

    const wet = resolveWet(moisture, precip, temp);
    const notes = [];
    if (estimated) notes.push('Schneetemperatur geschätzt: ' + temp + ' °C (' + SKY_LABEL[input.sky] + ').');
    if (moisture === 'auto') {
      notes.push('Feuchte automatisch als ' + (wet ? 'nass' : 'trocken') + ' gewertet. Im Formular änderbar.');
    }

    let cls = pickClass(temp);
    if (!cls) {
      cls = temp < CLASSES[0].min ? CLASSES[0] : CLASSES[CLASSES.length - 1];
      notes.push('Temperatur liegt ausserhalb des Katalogs. Nächste Stufe gewählt, beim Hersteller nachfragen.');
    }

    const race = pickRace(snowType, wet, cls);
    if (race.note) notes.push(race.note);

    const products = [];
    if (race.product) products.push(race.product);
    Object.values(PROPULSOR).forEach(function (p) {
      if (temp >= p.min && temp <= p.max) {
        products.push(snowType === 'neu' ? p.name : p.moly);
      }
    });

    const moly = snowType === 'kunst';
    if (moly) notes.push('Moly laut Chart nur für Kunstschnee.');

    return {
      color: cls.id,
      name: cls.name,
      description: cls.text,
      snowTemp: temp,
      snowType: snowType,
      snowTypeLabel: SNOW_LABEL[snowType],
      precip: precip,
      precipLabel: PRECIP_LABEL[precip],
      wet: wet,
      moisture: wet ? 'nass' : 'trocken',
      products: products,
      fluor: 'Kein Fluor nötig. Die Vola-Produkte hier sind fluorfrei.',
      finish: pickFinish(snowType, wet, moly),
      moly: moly,
      compose: pickCompose(snowType, precip, temp),
      types: {
        race: products,
        liquid: LIQUID[cls.id],
        base: pickBase(snowType, wet, temp),
        fishscale: null,
      },
      notes: notes,
    };
  }

  return {
    CLASSES: CLASSES,
    RACE: RACE,
    PROPULSOR: PROPULSOR,
    SNOW_TYPES: SNOW_TYPES,
    SNOW_LABEL: SNOW_LABEL,
    PRECIP: PRECIP,
    PRECIP_LABEL: PRECIP_LABEL,
    MOISTURE: MOISTURE,
    SKY_OFFSET: SKY_OFFSET,
    SKY_LABEL: SKY_LABEL,
    matchingClasses: matchingClasses,
    pickClass: pickClass,
    estimateSnowTemp: estimateSnowTemp,
    recommend: recommend,
  };
});
