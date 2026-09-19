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

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
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

  function leerKM(input) {
    var solo = input.value.replace(/[^0-9]/g, '');
    return solo === '' ? NaN : parseInt(solo, 10);
  }

  function formatearKM(input) {
    var solo = input.value.replace(/[^0-9]/g, '');
    if (solo === '') { input.value = ''; return; }
    input.value = parseInt(solo, 10).toLocaleString('es-AR');
  }

  function nro(n) {
    return n.toLocaleString('es-AR');
  }

  function digitos(input) {
    if (!input) return '';
    return input.value.replace(/[^0-9]/g, '');
  }

  function calcularDistancia() {
    var a = leerKM($('kmOrigen'));
    var b = leerKM($('kmDestino'));
    if (isNaN(a) || isNaN(b)) {
      distanciaShow.value = '—';
      return;
    }
    var d = b - a;
    if ($('kmDoble').checked) d = d * 2;
    distanciaShow.value = d < 0 ? 'Verificar km (negativo)' : nro(d) + ' km';
  }

  function mostrarToast(texto) {
    toast.textContent = texto;
    toast.classList.add('show');
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(function () {
      toast.classList.remove('show');
    }, 2800);
  }

  function renderLista() {
    var mes = mesInput.value || mesActualISO();
    var registros = leerRegistros(mes);
    var totalKm = 0;

    listaViajes.innerHTML = '';

    if (!registros.length) {
      var vacio = el('p', 'vacio');
      vacio.textContent = 'Todavía no hay viajes cargados en este mes.';
      listaViajes.appendChild(vacio);
    } else {
      registros.slice().reverse().forEach(function (r) {
        totalKm += isNaN(r.distancia) ? 0 : r.distancia;
        listaViajes.appendChild(buildItem(r));
      });
    }

    var label = registros.length === 1 ? 'viaje' : 'viajes';
    resumen.textContent = nombreMes(mes) + ' · ' + registros.length + ' ' + label + ' · ' + nro(totalKm) + ' km';
  }

  function fechaTexto(iso, hora) {
    var f = parseFecha(iso);
    var d = (f.dia || '--') + '/' + (f.mes || '--') + '/' + (f.anio || '----');
    return hora ? d + ' ' + hora : d;
  }

  function buildItem(r) {
    var div = el('div', 'viaje');

    var ruta = el('div', 'viaje-linea viaje-ruta');
    ruta.textContent = (r.origen || 'S/D') + ' a ' + (r.destino || 'S/D');
    div.appendChild(ruta);

    var fechas = el('div', 'viaje-linea viaje-fechas');
    fechas.textContent = 'Salida: ' + fechaTexto(r.fechaOrigen, r.horaOrigen) + '  ·  Llegada: ' + fechaTexto(r.fechaDestino, r.horaDestino);
    div.appendChild(fechas);

    var km = el('div', 'viaje-linea viaje-km');
    km.textContent = 'Distancia: ' + (r.distancia >= 0 ? nro(r.distancia) : 'n/d') + ' km' + (r.kmDoble ? ' · doble' : '');
    div.appendChild(km);

    var doc = el('div', 'viaje-linea viaje-doc');
    var partes = [];
    if (r.comprobante) partes.push('Comp: ' + r.comprobante);
    if (r.tipoCarga) partes.push('Carga: ' + r.tipoCarga);
    var marcados = [];
    if (r.f425a) marcados.push('4.2.5 (a): ' + r.f425a);
    if (r.f425b) marcados.push('4.2.5 (b): ' + r.f425b);
    if (r.f426) marcados.push('4.2.6: ' + fechaTexto(r.f426, ''));
    if (r.f4217) marcados.push('4.2.17');
    if (marcados.length) partes.push('Doc: ' + marcados.join(', '));
    if (r.observaciones) partes.push('Obs: ' + r.observaciones);
    doc.textContent = partes.length ? partes.join(' · ') : 'Sin documentación';
    div.appendChild(doc);

    var acciones = el('div', 'viaje-acciones');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-del';
    btn.textContent = 'Borrar viaje';
    btn.setAttribute('aria-label', 'Borrar viaje');
    btn.addEventListener('click', function () {
      if (window.confirm('¿Borrar este viaje?')) {
        borrarRegistro(r.id);
      }
    });
    acciones.appendChild(btn);
    div.appendChild(acciones);

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
    var kmOrigen = leerKM($('kmOrigen'));
    var fechaDestino = $('fechaDestino').value;
    var horaDestino = $('horaDestino').value;
    var destino = $('destino').value.trim();
    var kmDestino = leerKM($('kmDestino'));

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

    var kmDoble = chequearCheckbox('kmDoble');

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
      distancia: (kmDestino - kmOrigen) * (kmDoble ? 2 : 1),
      kmDoble: kmDoble,
      comprobante: $('comprobante').value.trim(),
      tipoCarga: $('tipoCarga').value.trim(),
      f425a: digitos($('f425a')),
      f425b: digitos($('f425b')),
      f426: $('f426').value,
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
      'Kilómetro doble',
      'N° de comprobante',
      'Tipo de carga',
      'Estadía 4.2.5 (a)',
      'Estadía 4.2.5 (b)',
      'Control descarga 4.2.6',
      '4.2.17',
      'Observaciones'
    ];

    function siNo(v) { return v ? 'Sí' : 'No'; }
    function doc425(v) {
      if (v === '' || v === undefined || v === null || v === false) return 'No';
      return v === true ? 'Sí' : v;
    }
    function docFecha(v) {
      if (v === true) return 'Sí';
      if (v === false || v === '' || v === undefined || v === null) return 'No';
      return fechaTexto(v, '');
    }

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
        siNo(r.kmDoble),
        r.comprobante,
        r.tipoCarga,
        doc425(r.f425a),
        doc425(r.f425b),
        docFecha(r.f426),
        siNo(r.f4217),
        r.observaciones
      ]);
    });

    if (typeof XLSX === 'undefined') {
      mostrarToast('Falta la librería de Excel. Verificá que js/xlsx.full.min.js esté subido');
      return;
    }

    var ws;
    try {
      ws = XLSX.utils.aoa_to_sheet(filas);
    } catch (err) {
      mostrarToast('Error al generar el Excel: ' + err.message);
      return;
    }
    ws['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 6 }, { wch: 6 }, { wch: 7 }, { wch: 8 },
      { wch: 22 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 7 }, { wch: 8 },
      { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 30 }
    ];

    try {
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Planilla');
      var nombreArchivo = 'Planilla_Fletes_' + mes + '.xlsx';
      XLSX.writeFile(wb, nombreArchivo);
      mostrarToast('Excel descargado');
    } catch (err) {
      mostrarToast('Error al descargar: ' + err.message);
    }
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

    $('kmOrigen').addEventListener('input', function () { formatearKM(this); calcularDistancia(); });
    $('kmDestino').addEventListener('input', function () { formatearKM(this); calcularDistancia(); });

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

  window.addEventListener('error', function (ev) {
    if (ev && ev.message) mostrarToast('Error: ' + ev.message);
  });

  document.addEventListener('DOMContentLoaded', init);
})();