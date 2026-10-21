# Cliente UDP para Consulta de IMC (Arquitectura Hexagonal)

Cliente interactivo por terminal desarrollado en **Node.js** y **TypeScript**, comunicándose mediante datagramas **UDP/IP** (`node:dgram`) y estructurado bajo los principios de la **Arquitectura Hexagonal (Puertos y Adaptadores)**.

---

## Arquitectura del Proyecto

El cliente desacopla completamente la lógica de negocio y los casos de uso tanto del transporte de red (UDP) como de la interfaz de usuario (CLI):

```
imc-udp-client-node-hexagonal/
├── src/
│   ├── domain/                         # Entidades del cliente
│   │   ├── model/
│   │   │   ├── SolicitudImc.ts         # Parámetros validados de la consulta
│   │   │   └── RespuestaImc.ts         # Encapsulación de la respuesta del servidor
│   ├── application/                    # Casos de uso y puertos
│   │   ├── ports/
│   │   │   ├── in/
│   │   │   │   └── ConsultarImcUseCase.ts # Driving Port (usado por CLI/UI)
│   │   │   └── out/
│   │   │       └── NetworkClientPort.ts   # Driven Port (abstracción de red)
│   │   └── usecases/
│   │       └── ConsultarImcUseCaseImpl.ts # Implementación del caso de uso
│   ├── infrastructure/                 # Adaptadores de infraestructura
│   │   └── adapters/
│   │       ├── udp/
│   │       │   └── UdpClientAdapter.ts    # Socket UDP dgram con correlación de ID y timeout
│   │       └── cli/
│   │           └── ConsoleCliAdapter.ts   # Interfaz interactiva por terminal (readline)
│   └── index.ts                        # Composition Root / Bootstrap
├── test/
│   └── application/                    # Pruebas unitarias
├── package.json
├── tsconfig.json
└── README.md
```

---

## Protocolo de Comunicación UDP/IP

El cliente envía datagramas UDP en formato JSON y espera la respuesta correlacionada con el mismo `id`:

### Petición enviada:
```json
{
  "id": "req-1711000000000",
  "peso": 72.5,
  "altura": 1.76
}
```

### Respuesta esperada del servidor:
```json
{
  "id": "req-1711000000000",
  "status": "SUCCESS",
  "data": {
    "imc": 23.41,
    "clasificacion": "Normal (Peso saludable)",
    "interpretacion": "Su peso se encuentra dentro del rango óptimo y saludable según la OMS."
  },
  "timestamp": "2026-09-18T20:45:00.000Z"
}
```

---

## Instalación y Ejecución

### Prerrequisitos
- Node.js >= 20
- Gestor de paquetes `pnpm` o `npm`
- Servidor UDP en ejecución (por defecto en `127.0.0.1:9050`)

### Pasos

1. Instalar dependencias:
   ```bash
   pnpm install
   # o bien: npm install
   ```

2. Ejecutar el cliente interactivo:
   ```bash
   pnpm dev
   # o bien: npm run dev
   ```

3. Variables de entorno configurables:
   - `SERVER_HOST`: Dirección IP o host del servidor UDP (por defecto: `127.0.0.1`).
   - `SERVER_PORT`: Puerto del servidor UDP (por defecto: `9050`).
   - `TIMEOUT_MS`: Tiempo máximo de espera en milisegundos (por defecto: `4000`).

   *Ejemplo conectándose a otro equipo en la red local:*
   ```powershell
   $env:SERVER_HOST="192.168.1.50"; $env:SERVER_PORT="9050"; pnpm dev
   ```

4. Ejecutar pruebas unitarias:
   ```bash
   pnpm test
   ```


## Separación hexagonal y verificación

El dominio contiene los modelos y reglas del IMC. La aplicación expone puertos de entrada y orquesta los casos de uso. Los adaptadores de infraestructura implementan la consola, UDP y el registro de eventos. Las dependencias apuntan hacia aplicación y dominio; estas capas no importan sockets ni consola.

La carpeta `src/bootstrap` conecta las implementaciones concretas. Sus funciones permiten crear el cliente sin arrancarlo, para reutilizar los casos de uso y probarlos. `src/index.ts` es el punto de entrada ejecutable. Los módulos JSON del adaptador UDP validan el contrato externo antes de entregar los datos a la aplicación.

Flujo completo:

`Consola → ConsultarImcUseCase → NetworkClientPort → UDP → CalcularImcUseCase → Dominio IMC`

La respuesta recorre el camino inverso. El servidor acepta altura en metros o centímetros. El cliente correlaciona cada respuesta por el id y contempla un tiempo de espera; UDP no garantiza entrega.

Para ejecutar, abrir una terminal en cada proyecto. Primero ejecutar `npm run dev` en el servidor y después en el cliente. Por defecto se utiliza el puerto 9050 y el cliente apunta a 127.0.0.1. Para otro equipo, configurar SERVER_HOST en el cliente con la dirección del servidor.

Validación: `npm run build` y `npm test`. Las pruebas incluyen datagramas reales, formatos inválidos y correlación de respuestas concurrentes.

El proyecto ofrece UDP y RPC sobre HTTP en Node.js. RPC permite invocar métodos remotos, pero no implementa Java RMI ni su protocolo. Si la guía exige Java RMI, confirmar con el docente si acepta esta alternativa.


## Invocación remota con Node.js (RPC)

No requiere Java ni dependencias de producción adicionales. Utiliza Node.js 20 o superior y TypeScript. Es un protocolo RPC propio sobre HTTP, no JSON-RPC 2.0 ni Java RMI.

1. En la terminal del servidor: `npm run dev:rpc`.
2. En la terminal del cliente: `npm run dev:rpc`.
3. Introducir peso y altura; el cliente invoca el método remoto `calcularImc`.

Para ejecutar compilado, usar `npm run build` en ambos proyectos y después `npm run start:rpc` en cada uno. El comando `npm run dev` continúa ejecutando UDP.

Configuración RPC:

| Variable | Proyecto | Valor predeterminado |
|---|---|---|
| RPC_HOST | Servidor | 127.0.0.1 |
| RPC_PORT | Ambos | 9060 |
| SERVER_HOST | Cliente | 127.0.0.1 |
| TIMEOUT_MS | Cliente | 4000 |

Para equipos distintos, configurar RPC_HOST=0.0.0.0 en el servidor y SERVER_HOST con la IP del servidor en el cliente.

Contrato: `POST /rpc`, cuerpo JSON:

`{ "id": "ejemplo-1", "method": "calcularImc", "params": { "peso": 70, "altura": 175 } }`

La respuesta incluye `id` y `result`. El resultado conserva el contrato del caso de uso: status, data o error y timestamp. Un fallo de protocolo devuelve un estado HTTP de error y el campo error; los errores de negocio se devuelven dentro de result con status ERROR.

La consola depende del puerto ConsultarImcUseCase; el adaptador RPC del cliente implementa NetworkClientPort. En el servidor, el adaptador RPC invoca CalcularImcUseCase. No se duplican las reglas de IMC. Los archivos createRpcClient/createRpcServer en src/bootstrap conectan las implementaciones.

Pruebas unitarias y de transporte: `npm test`. Para verificar ambos proyectos juntos, compilar ambos y ejecutar `npm run test:rpc:e2e` desde el cliente. La prueba presupone que las carpetas del cliente y servidor están una al lado de la otra con sus nombres actuales.
