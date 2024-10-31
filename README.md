Este proyecto es el servidor y la plataforma de control de chatbots de Xira Intelligence.
Con esta plataforma puedes modificar el flujo de un chatbot, entrenar nuevas intenciones de lenguaje y ver datos generados por el chatbot

## Instalación

Descarga el proyecto y corre los siguientes comandos:

### `npm install`

Esto va a instalar todas las dependencias que necesita el servidor.

### `npm run BASE_DE_DATOS` opciones: mysql|sqlserver|sqlite

Si nuestro proyecto necesita consultar una base de datos que no sea la de mongodb para los datos de reportería, tenemos que correr ese comando indicando cual base de datos se utilizará

### `rellenar el archivo .env`

Ya que todo se encuentre correctamente instalado, tenemos que rellenar los datos del archivo .env para que pueda hacer las conexiones a base de datos y pueda entrenar el reconomiciento de lenguaje en WIT

## Cuelga el servidor

Una vez completados esos pasos, solamente inicializa el proceso del servidor (de preferencia con PM2).
