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
