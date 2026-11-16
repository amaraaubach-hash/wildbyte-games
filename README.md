# WildByte Games — web del estudio

Web estática (HTML + CSS + JS sin dependencias). Se abre con doble clic en `index.html`
y se sube tal cual a GitHub Pages, Netlify o Cloudflare Pages.

## Estructura (respétala tal cual)

```
wildbyte-games/            ← raíz del sitio (esta carpeta se sube entera)
├── index.html             ← página principal
├── privacidad.html        ← política de privacidad (URL para Google Play Console)
├── app-ads.txt            ← DEBE estar en la raíz
├── .nojekyll              ← para GitHub Pages (no lo borres)
├── css/styles.css         ← estilos compartidos
├── js/main.js             ← menú móvil + arrastrar imágenes (ratón y táctil)
└── assets/
    ├── fonts/             ← fuentes autoalojadas (sin Google Fonts → mejor para el RGPD)
    ├── press/wildbyte-presskit.zip
    └── img/
        ├── wildbyte-logo.svg
        ├── crazy-cube-battle/   ← imágenes ya sin fondo
        └── zoo-war-of-paws/     ← pon aquí icono.png y portada.png (ver LEEME.txt)
```

## Publicar

**Netlify (lo más fácil):** app.netlify.com → *Add new site* → *Deploy manually* → arrastra la carpeta `wildbyte-games`.

**GitHub Pages:** crea un repositorio llamado **`TU-USUARIO.github.io`** (con ese nombre exacto),
sube el contenido de esta carpeta a la raíz y activa *Settings → Pages → Deploy from branch (main)*.
> Importante: si usas un repositorio con otro nombre, la web quedará en `TU-USUARIO.github.io/repo/`
> y **AdMob no encontrará `app-ads.txt`**, porque tiene que estar en la raíz del dominio.

## Pendiente de personalizar

1. `index.html` → enlace de Google Play de *Zoo: War of Paws* (busca `com.globalzoo.pawofwars`).
2. `app-ads.txt` → tu ID de editor de AdMob (`pub-...`) cuando monetices.
3. `privacidad.html` → si WildByte Games no es una empresa registrada, añade tu nombre como titular (hay un comentario preparado).
4. Play Console → *Ficha de Play Store → Detalles de contacto → Sitio web*: pon la URL raíz de la web.
   *Política de la app → Política de privacidad*: `https://TU-DOMINIO/privacidad.html`.
   *Eliminación de datos*: `https://TU-DOMINIO/privacidad.html#eliminar-datos`.

## Hacer arrastrable cualquier imagen nueva

```html
<div class="drag-zone" data-drag-zone style="height:300px">
  <div class="drag-item" data-draggable tabindex="0" style="--x:10%;--y:10%;--w:40%">
    <img src="assets/img/mi-imagen.png" alt="Descripción">
  </div>
  <button class="drag-reset" type="button" data-drag-reset>↺ Recolocar</button>
</div>
```
`--x` / `--y` = posición inicial, `--w` = ancho. Doble clic o doble toque devuelve la imagen a su sitio.
