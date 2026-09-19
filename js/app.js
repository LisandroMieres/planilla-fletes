(function () {
  'use strict';

  var CFG_KEY = 'planilla_cfg_v1';
  var STORAGE_PREFIX = 'planilla_mes_';
  var STORAGE_VERSION = '_v1';
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  var $ = function (id) { return document.getElementById(id); };

  var mesInput = $('mes');
  var resumen = $('resumen');
  var listaViajes = $('listaViajes');
  var formViaje = $('formViaje');
  var distanciaShow = $('distanciaShow');
  var toast = $('toast');
  var badge = $('onlineBadge');

  var IC_TRUCK = '<svg class="ic"><use href="#ic-truck"></use></svg>';
  var IC_ARROW = '<svg class="ic"><use href="#ic-arrow"></use></svg>';
  var IC_TRASH = '<svg class="ic"><use href="#ic-trash"></use></svg>';

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function formatearFecha(iso) {
    if (!iso) return '—';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function addChip(parent, txt, cls) {
    var c = el('span', 'chip-info' + (cls ? ' ' + cls : ''));
    c.textContent = txt;
    parent.appendChild(c);
  }

  function hoyISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function mesActualISO() {
    return hoyISO().slice(0, 7);
  }

  function recordsKey(mes) {
    return STORAGE_PREFIX + mes + STORAGE_VERSION;
  }

  function leerConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function guardarConfig(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  function leerRegistros(mes) {
    try { return JSON.parse(localStorage.getItem(recordsKey(mes))) || []; }
    catch (e) { return []; }
  }

  function guardarRegistros(mes, registros) {
    localStorage.setItem(recordsKey(mes), JSON.stringify(registros));
  }

  function nombreMes(mes) {
    var partes = mes.split('-');
    var anio = partes[0];
    var m = parseInt(partes[1], 10) - 1;
    return MESES[m] + ' ' + anio;
  }

  function parseFecha(iso) {
    if (!iso) return { dia: '', mes: '', anio: '' };
    var p = iso.split('-');
    return { dia: p[2], mes: p[1], anio: p[0] };
  }

  function loadSettings() {
    var cfg = leerConfig();
    $('camion').value = cfg.camion || '';
    $('conductor').value = cfg.conductor || '';
  }

  function saveSettings() {
    var cfg = leerConfig();
    cfg.camion = $('camion').value.trim();
    cfg.conductor = $('conductor').value.trim();
    guardarConfig(cfg);
  }

  function calcularDistancia() {
    var a = parseFloat($('kmOrigen').value);
    var b = parseFloat($('kmDestino').value);
    if (isNaN(a) || isNaN(b)) {
      distanciaShow.value = '—';
      return;
    }
    var d = b - a;
    distanciaShow.value = d < 0 ? 'Verificar km (negativo)' : d + ' km';
  }

  function mostrarToast(texto) {
    toast.textContent = texto;
    toast.classList.add('show');
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  }

  function renderLista() {
    var mes = mesInput.value || mesActualISO();
    var registros = leerRegistros(mes);
    var totalKm = 0;

    listaViajes.innerHTML = '';

    if (!registros.length) {
      var vacio = el('div', 'vacio');
      var vIcon = document.createElement('span');
      vIcon.innerHTML = IC_TRUCK;
      var vStrong = el('strong');
      vStrong.textContent = 'Todavía no hay viajes';
      var vP = el('p');
      vP.textContent = 'Cargá tu primer viaje con el formulario ↑';
      vacio.appendChild(vIcon);
      vacio.appendChild(vStrong);
      vacio.appendChild(vP);
      listaViajes.appendChild(vacio);
    } else {
      registros.slice().reverse().forEach(function (r) {
        totalKm += isNaN(r.distancia) ? 0 : r.distancia;
        listaViajes.appendChild(buildItem(r));
      });
    }

    $('statViajes').textContent = registros.length;
    $('statKm').textContent = totalKm;
    $('statProm').textContent = registros.length ? Math.round(totalKm / registros.length) : 0;
    resumen.textContent = nombreMes(mes);
  }

  function buildItem(r) {
    var div = el('div', 'viaje');

    var top = el('div', 'viaje-top');
    var info = el('div', 'viaje-info');

    var fechas = el('div', 'viaje-fechas');
    var salida = el('span', 'chip chip-salida');
    salida.textContent = 'Salida ' + formatearFecha(r.fechaOrigen) + (r.horaOrigen ? ' ' + r.horaOrigen : '');
    fechas.appendChild(salida);
    var llegada = el('span', 'chip chip-llegada');
    llegada.textContent = 'Llegada ' + formatearFecha(r.fechaDestino) + (r.horaDestino ? ' ' + r.horaDestino : '');
    fechas.appendChild(llegada);
    info.appendChild(fechas);

    var ruta = el('div', 'viaje-ruta');
    var o = el('span', 'lugar');
    o.textContent = r.origen || 'S/D';
    var a = document.createElement('span');
    a.innerHTML = IC_ARROW;
    var d = el('span', 'lugar');
    d.textContent = r.destino || 'S/D';
    ruta.appendChild(o);
    ruta.appendChild(a);
    ruta.appendChild(d);
    info.appendChild(ruta);

    top.appendChild(info);

    var side = el('div', 'viaje-side');
    var km = el('span', 'pill-km');
    km.textContent = (r.distancia >= 0 ? r.distancia : 'n/d') + ' km';
    side.appendChild(km);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-del';
    btn.title = 'Borrar viaje';
    btn.setAttribute('aria-label', 'Borrar viaje');
    btn.innerHTML = IC_TRASH;
    btn.addEventListener('click', function () {
      if (window.confirm('¿Borrar este viaje?')) {
        borrarRegistro(r.id);
      }
    });
    side.appendChild(btn);

    top.appendChild(side);
    div.appendChild(top);

    var meta = el('div', 'viaje-meta');
    if (r.comprobante) addChip(meta, 'Comp. ' + r.comprobante);
    if (r.tipoCarga) addChip(meta, r.tipoCarga);
    var DOC_LABELS = { f425a: '4.2.5 (a)', f425b: '4.2.5 (b)', f426: '4.2.6', f4217: '4.2.17' };
    ['f425a', 'f425b', 'f426', 'f4217'].forEach(function (doc) {
      if (r[doc]) {
        var c = el('span', 'chip-ok');
        c.textContent = DOC_LABELS[doc];
        meta.appendChild(c);
      }
    });
    if (r.observaciones) addChip(meta, r.observaciones);
    div.appendChild(meta);

    return div;
  }

  function borrarRegistro(id) {
    var mes = mesInput.value || mesActualISO();
    var registros = leerRegistros(mes);
    var nuevos = registros.filter(function (r) { return r.id !== id; });
    if (nuevos.length !== registros.length) {
      guardarRegistros(mes, nuevos);
      renderLista();
      mostrarToast('Viaje eliminado');
    }
  }

  function chequearCheckbox(id) {
    return document.getElementById(id).checked;
  }

  function guardarViaje(e) {
    e.preventDefault();
    saveSettings();

    var camion = $('camion').value.trim();
    var conductor = $('conductor').value.trim();
    var fechaOrigen = $('fechaOrigen').value;
    var horaOrigen = $('horaOrigen').value;
    var origen = $('origen').value.trim();
    var kmOrigen = parseFloat($('kmOrigen').value);
    var fechaDestino = $('fechaDestino').value;
    var horaDestino = $('horaDestino').value;
    var destino = $('destino').value.trim();
    var kmDestino = parseFloat($('kmDestino').value);

    if (!fechaOrigen || !origen || !destino) {
      mostrarToast('Completá fecha, origen y destino');
      return;
    }
    if (isNaN(kmOrigen) || isNaN(kmDestino)) {
      mostrarToast('Ingresá los kilómetros de salida y llegada');
      return;
    }
    if (kmDestino - kmOrigen < 0) {
      mostrarToast('Los km de llegada son menores que los de salida');
      return;
    }

    var registro = {
      id: Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000),
      camion: camion,
      conductor: conductor,
      fechaOrigen: fechaOrigen,
      horaOrigen: horaOrigen,
      origen: origen,
      kmOrigen: kmOrigen,
      fechaDestino: fechaDestino,
      horaDestino: horaDestino,
      destino: destino,
      kmDestino: kmDestino,
      distancia: kmDestino - kmOrigen,
      comprobante: $('comprobante').value.trim(),
      tipoCarga: $('tipoCarga').value.trim(),
      f425a: chequearCheckbox('f425a'),
      f425b: chequearCheckbox('f425b'),
      f426: chequearCheckbox('f426'),
      f4217: chequearCheckbox('f4217'),
      observaciones: $('observaciones').value.trim(),
      creado: new Date().toISOString()
    };

    var mes = fechaOrigen.slice(0, 7);
    var registros = leerRegistros(mes);
    registros.push(registro);
    guardarRegistros(mes, registros);

    if (!mesInput.value || mesInput.value !== mes) mesInput.value = mes;
    formViaje.reset();
    $('fechaOrigen').value = hoyISO();
    $('fechaDestino').value = '';
    loadSettings();
    calcularDistancia();
    renderLista();
    mostrarToast('Viaje guardado');
  }

  function limpiarMes() {
    var mes = mesInput.value || mesActualISO();
    var registros = leerRegistros(mes);
    if (!registros.length) {
      mostrarToast('No hay viajes para limpiar en este mes');
      return;
    }
    if (!window.confirm('¿Limpiar todos los ' + registros.length + ' viajes de ' + nombreMes(mes) + '?')) return;
    localStorage.removeItem(recordsKey(mes));
    renderLista();
    mostrarToast('Mes limpiado');
  }

  function exportarExcel() {
    var mes = mesInput.value || mesActualISO();
    var registros = leerRegistros(mes);

    if (!registros.length) {
      mostrarToast('No hay viajes para exportar');
      return;
    }

    var headers = [
      'Camión',
      'Conductor',
      'Día (origen)',
      'Mes (origen)',
      'Año (origen)',
      'Hora (origen)',
      'Origen',
      'Kilómetros (origen)',
      'Día (destino)',
      'Mes (destino)',
      'Año (destino)',
      'Hora (destino)',
      'Destino',
      'Kilómetros (destino)',
      'Distancia (km)',
      'N° de comprobante',
      'Tipo de carga',
      '4.2.5 (a)',
      '4.2.5 (b)',
      '4.2.6',
      '4.2.17',
      'Observaciones'
    ];

    function siNo(v) { return v ? 'Sí' : 'No'; }

    var filas = [headers];
    registros.forEach(function (r) {
      var fO = parseFecha(r.fechaOrigen);
      var fD = parseFecha(r.fechaDestino);
      filas.push([
        r.camion,
        r.conductor,
        fO.dia,
        fO.mes,
        fO.anio,
        r.horaOrigen,
        r.origen,
        r.kmOrigen,
        fD.dia,
        fD.mes,
        fD.anio,
        r.horaDestino,
        r.destino,
        r.kmDestino,
        r.distancia,
        r.comprobante,
        r.tipoCarga,
        siNo(r.f425a),
        siNo(r.f425b),
        siNo(r.f426),
        siNo(r.f4217),
        r.observaciones
      ]);
    });

    if (typeof XLSX === 'undefined') {
      mostrarToast('Librería de Excel no disponible (sin conexión)');
      return;
    }

    var ws = XLSX.utils.aoa_to_sheet(filas);
    ws['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 6 }, { wch: 6 }, { wch: 7 }, { wch: 8 },
      { wch: 22 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 7 }, { wch: 8 },
      { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }
    ];

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla');

    var nombreArchivo = 'Planilla_Fletes_' + mes + '.xlsx';
    XLSX.writeFile(wb, nombreArchivo);
    mostrarToast('Excel descargado');
  }

  function setOnline(on) {
    $('badgeTexto').textContent = on ? 'online' : 'offline';
    badge.classList.toggle('badge-on', on);
    badge.classList.toggle('badge-off', !on);
  }

  function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  function init() {
    if (!mesInput.value) mesInput.value = mesActualISO();
    loadSettings();

    if (!$('fechaOrigen').value) $('fechaOrigen').value = hoyISO();

    $('kmOrigen').addEventListener('input', calcularDistancia);
    $('kmDestino').addEventListener('input', calcularDistancia);

    $('camion').addEventListener('change', saveSettings);
    $('conductor').addEventListener('change', saveSettings);

    $('fechaOrigen').addEventListener('change', function () {
      if (!$('fechaDestino').value) $('fechaDestino').value = $('fechaOrigen').value;
    });

    mesInput.addEventListener('change', renderLista);

    formViaje.addEventListener('submit', guardarViaje);
    $('btnLimpiar').addEventListener('click', limpiarMes);
    $('btnExport').addEventListener('click', exportarExcel);

    setOnline(navigator.onLine);
    window.addEventListener('online', function () { setOnline(true); });
    window.addEventListener('offline', function () { setOnline(false); });

    calcularDistancia();
    renderLista();
    registrarServiceWorker();
  }

  document.addEventListener('DOMContentLoaded', init);
})();