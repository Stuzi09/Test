(function () {
  const form = document.getElementById('form');
  const errorEl = document.getElementById('error');
  const result = document.getElementById('result');

  const COLORS = {
    gelb: '#f5c400',
    rot: '#d6322b',
    violett: '#7a3fb0',
    blau: '#1f6fd1',
    gruen: '#2e9e4f',
  };

  function readNumber(id) {
    const raw = document.getElementById(id).value.trim();
    if (raw === '') return undefined;
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    result.hidden = true;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function render(r) {
    document.getElementById('swatch').style.background = COLORS[r.color];
    document.getElementById('resultName').textContent = r.name;
    document.getElementById('resultDesc').textContent =
      r.description + ' Schnee: ' + r.snowTemp + ' °C, ' + r.snowTypeLabel + ', ' + r.precipLabel + ', ' + r.moisture + '.';

    document.getElementById('tRace').textContent = r.types.race.join(' + ');
    document.getElementById('tLiquid').textContent = r.types.liquid + ' (fluorfrei)';

    document.getElementById('resultFinish').textContent = r.finish;
    document.getElementById('resultCompose').textContent = r.compose.text;

    const notes = document.getElementById('resultNotes');
    notes.replaceChildren();
    r.notes.forEach(function (text) {
      const li = document.createElement('li');
      li.textContent = text;
      notes.appendChild(li);
    });

    result.hidden = false;
  }

  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('sw.js');
    } catch (err) {
      // Ohne Offline-Cache läuft die App trotzdem.
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    const airTemp = readNumber('airTemp');
    const snowTemp = readNumber('snowTemp');

    if (snowTemp === undefined && airTemp === undefined) {
      return showError('Bitte mindestens die Lufttemperatur oder die Schneetemperatur eingeben.');
    }
    if (Number.isNaN(airTemp) || Number.isNaN(snowTemp)) {
      return showError('Eine der Temperaturen ist keine gültige Zahl.');
    }

    const input = {
      airTemp: airTemp,
      sky: document.getElementById('sky').value,
      precip: document.getElementById('precip').value,
      snowType: document.getElementById('snowType').value,
      moisture: document.getElementById('moisture').value,
      snowTemp: snowTemp,
    };

    try {
      render(Wax.recommend(input));
    } catch (err) {
      showError(err.message);
    }
  });
})();
