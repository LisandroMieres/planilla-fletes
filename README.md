# Planilla de Control de Fletes (PWA)

Aplicación Web Progresiva **offline-first** para digitalizar la planilla de control de fletes desde el celular del camionero. Los datos se guardan en el dispositivo (localStorage), por lo que no necesita internet para operar.

## Stack

- HTML + CSS + JavaScript vanilla (sin frameworks ni build).
- SheetJS (xlsx) incluida localmente en `js/xlsx.full.min.js` para generar el Excel sin conexión.
- Service Worker (`sw.js`) + `manifest.json` para instalarla en el celular y usarla sin internet.
- Alojamiento: **Netlify** (estático y gratuito).

## Estructura

planilla-fletes/
├── index.html          # Interfaz (mobile-first)
├── css/styles.css      # Estilos
├── js/app.js           # Lógica: formulario, localStorage, listado, exportación
├── js/xlsx.full.min.js # Librería SheetJS local
├── manifest.json       # Datos de la PWA (instalable)
├── sw.js               # Service worker (caché offline)
├── icons/              # Iconos 192 y 512 px
├── netlify.toml        # Configuración de Netlify
└── README.md

## Cómo usar

1. **Datos fijos**: cargá una vez Camión N° y Conductor; quedan guardados y se autocompletan.
2. **Viaje**: fecha, hora, origen/destino y kilómetros de salida y llegada. La distancia se calcula sola (km destino − km origen). La fecha de llegada se rellena sola con la de salida.
3. **Documentación**: número de comprobante, tipo de carga, casilleros 4.2.5 (a/b), 4.2.6, 4.2.17 y observaciones.
4. **Listado mensual**: abajo se ven los viajes del mes seleccionado, con botón para borrar uno por uno.
5. **Exportar**: el botón fijo inferior descarga `Planilla_Fletes_YYYY-MM.xlsx` con las columnas ordenadas.
6. **Limpiar mes**: borra los viajes del mes para arrancar el ciclo siguiente.

### Almacenamiento

- Configuración (camión/conductor): clave `planilla_cfg_v1`.
- Viajes por mes: claves `planilla_mes_YYYY-MM_v1`.
- Todo queda solo en el dispositivo; la nube no guarda nada.