# Solución al Error SQLITE_READONLY

## Acceso Rápido

| Necesidad | Ubicación | Rol |
|-----------|-----------|-----|
| Resolver error "attempt to write a readonly database" | [Diagnóstico](#diagnóstico) | Desarrollador |
| Entender causas del error | [Causas Raíz](#causas-raíz) | Desarrollador/DevOps |
| Aplicar solución completa | [Solución Paso a Paso](#solución-paso-a-paso) | Desarrollador |
| Verificar estado después de solución | [Verificación](#verificación) | QA/DevOps |
| Prevenir el error en el futuro | [Prevención](#prevención) | DevOps |

## Diagnóstico

### Síntoma

Al ejecutar `make test-webhook`, se recibe error HTTP 500 con el mensaje:

```
SQLITE_READONLY: attempt to write a readonly database
```

### Verificación del Problema

| Comando | Resultado Esperado | Indica |
|---------|-------------------|--------|
| `make test-webhook` | HTTP 500, error SQLITE_READONLY | Base de datos en modo solo lectura |
| `ls -la webhooks.db` | Archivo existe en raíz (12KB) | Inconsistencia de configuración |
| `ls -la data/` | Directorio vacío o sin permisos | Ruta configurada no accesible |
| `cat .env \| grep DB_PATH` | `DB_PATH=./data/webhooks.db` | Configuración vs realidad |
| `netstat -ano \| findstr :3000` | Múltiples procesos en puerto 3000 | Posible bloqueo de archivo |

## Causas Raíz

### Causa #1: Inconsistencia entre Configuración y Archivos Existentes

| Configuración (.env) | Realidad | Problema |
|---------------------|----------|----------|
| `DB_PATH=./data/webhooks.db` | `webhooks.db` existe en raíz | Servidor usa archivo incorrecto |
| Directorio `data/` vacío | Base de datos en ubicación anterior | SQLite no puede escribir en ruta configurada |

**Secuencia del Error:**
1. Servidor lee `DB_PATH=./data/webhooks.db` del `.env`
2. Intenta crear/escribir en `./data/webhooks.db`
3. El directorio `data/` existe pero está vacío o sin permisos
4. SQLite cae back a `webhooks.db` en raíz (creado previamente)
5. El archivo puede estar bloqueado por otro proceso o sin permisos de escritura
6. Resultado: SQLITE_READONLY

### Causa #2: Múltiples Procesos Bloqueando el Archivo

| Situación | Comando de verificación | Resultado |
|-----------|------------------------|-----------|
| Procesos Node zombie | `tasklist /FI "IMAGENAME eq node.exe"` | Múltiples instancias de node.exe |
| Puerto 3000 ocupado | `netstat -ano \| findstr :3000` | Varios procesos listening/established |

**Efecto:** Un proceso previo mantiene bloqueado el archivo de base de datos, impidiendo que el proceso actual escriba.

### Causa #3: Permisos de Directorio Insuficientes

| Ubicación | Permiso Requerido | Problema Común |
|-----------|------------------|----------------|
| `./data/` | Escritura para usuario actual | Windows: permisos heredados incorrectos |
| `./webhooks.db` | Escritura y no bloqueo exclusivo | Archivo marcado como solo lectura |

## Solución Paso a Paso

### Paso 1: Detener Todos los Procesos de Node

**Windows:**
```cmd
taskkill /F /IM node.exe
```

**Linux/Mac:**
```bash
killall node
# o
pkill -f node
```

**Verificación:**
```bash
tasklist /FI "IMAGENAME eq node.exe"
# Debe mostrar: "No se estan ejecutando tareas con los criterios especificados."
```

### Paso 2: Limpiar Bases de Datos Inconsistentes

**Windows:**
```cmd
:: Eliminar base de datos antigua en raíz
del webhooks.db

:: Limpiar y recrear directorio data
rmdir /S /Q data
mkdir data
```

**Linux/Mac:**
```bash
# Eliminar base de datos antigua en raíz
rm -f webhooks.db

# Limpiar y recrear directorio data
rm -rf data
mkdir data
```

### Paso 3: Verificar y Corregir Permisos

**Windows:**
```cmd
:: Verificar permisos actuales
icacls data

:: Otorgar permisos de escritura al usuario actual
icacls data /grant %username%:F

:: Alternativa: permisos para todos
icacls data /grant Everyone:F
```

**Linux/Mac:**
```bash
# Verificar permisos
ls -la data/

# Corregir permisos
chmod 755 data/

# Si es necesario, cambiar propietario
sudo chown $USER:$USER data/
```

### Paso 4: Iniciar el Servidor

```bash
make dev
```

**Salida esperada:**
```
🚀 Webhook Receiver iniciado en puerto 3000
📊 Base de datos: ./data/webhooks.db
✅ Conectado a SQLite
```

### Paso 5: Verificar Creación Correcta de Base de Datos

```bash
:: Windows
dir data\

:: Linux/Mac
ls -la data/
```

**Debe mostrar:**
```
webhooks.db    12KB (o tamaño similar)
```

### Paso 6: Probar Webhook

```bash
make test-webhook
```

**Resultado esperado:**
```
📤 Enviando webhook 1/1 a localhost:3000/webhook/test
✅ Webhook 1 exitoso (Status: 201)

📊 Resultados:
✅ Exitosos: 1
❌ Fallidos: 0
```

## Verificación

### Post-Solución

| Comando | Estado Esperado |
|---------|-----------------|
| `make test-webhook` | HTTP 201 Created |
| `ls -la data/webhooks.db` | Archivo existe con tamaño > 0 |
| `curl http://localhost:3000/api/webhooks` | Lista webhooks recibidos |
| `curl http://localhost:3000/health` | `{"status":"healthy"}` |

### Verificación de Logs

```bash
:: Verificar que no hay errores SQLite
docker logs docker-webhook-receiver-1 2>&1 | findstr SQLITE
:: Debe no mostrar nada

:: O en modo desarrollo (sin Docker)
npm run dev 2>&1 | findstr SQLITE
```

## Prevención

### Checklist Pre-Desarrollo

- [ ] Verificar que no hay procesos Node ejecutándose: `tasklist /FI "IMAGENAME eq node.exe"`
- [ ] Confirmar que `DB_PATH` en `.env` apunta a ubicación válida y con permisos
- [ ] Asegurar que el directorio de datos existe antes de iniciar el servidor
- [ ] Si se cambia `DB_PATH`, migrar o eliminar base de datos anterior

### Configuración Recomendada (.env)

```bash
# Puerto del servidor
PORT=3000

# Ruta de la base de datos SQLite
# Usar ruta absoluta para evitar confusiones
DB_PATH=./data/webhooks.db

# Entorno (development, production)
NODE_ENV=development
```

### Script de Inicio Seguro

**Windows (start-server.bat):**
```batch
@echo off
echo Verificando procesos Node existentes...
taskkill /F /IM node.exe 2>nul

echo Verificando directorio de datos...
if not exist data mkdir data

echo Iniciando servidor...
make dev
```

**Linux/Mac (start-server.sh):**
```bash
#!/bin/bash
echo "Verificando procesos Node existentes..."
killall node 2>/dev/null

echo "Verificando directorio de datos..."
mkdir -p data

echo "Iniciando servidor..."
make dev
```

## Solución de Problemas

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| Error persiste tras limpieza | `icacls data` muestra permisos incorrectos | Ejecutar terminal como Administrador, reaplicar permisos |
| Archivo webhooks.db se recrea en raíz | `DB_PATH` no está siendo leído | Verificar que `.env` está en raíz del proyecto |
| "Permission denied" al eliminar webhooks.db | Archivo bloqueado por proceso | Usar `taskkill /F /IM node.exe` primero |
| Directorio data no se crea | Permisos de sistema restringidos | Crear manualmente con explorador de archivos |
| Error en Docker: SQLITE_READONLY | Contenedor sin permisos en volumen | Verificar [SOLUCION-DOCKER-SQLITE3-WINDOWS.md](./SOLUCION-DOCKER-SQLITE3-WINDOWS.md) |

## Referencias Cruzadas

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Guía de Docker Compose | `docs/GUIA-PRUEBAS-DOCKER-COMPOSE.md` | Testing con Docker Compose |
| Solución Docker Windows | `docs/SOLUCION-DOCKER-SQLITE3-WINDOWS.md` | Errores específicos de Docker en Windows |
| Solución Docker Build | `docs/SOLUCION-DOCKER-SQLITE3.md` | Problemas de build con sqlite3 |
| Guía Prueba Desarrollador | `docs/GUIA-PRUEBA-DESARROLLADOR.md` | Flujo completo de pruebas |
| Comandos de Referencia | `docs/COMANDOS-REFERENCIA.md` | Comandos adicionales |

## Historial de Incidentes

| Fecha | Problema | Causa | Solución Aplicada |
|-------|----------|-------|-------------------|
| 2026-02-10 | SQLITE_READONLY al enviar webhook | Inconsistencia entre DB_PATH y archivos existentes + múltiples procesos Node | Limpieza de bases de datos, eliminación de procesos zombie, recreación de directorio data |

## Versionado

| Versión | Fecha | Estado | Comentarios |
|---------|-------|--------|-------------|
| 1.0.0 | 2026-02-10 | Estable | Documentación inicial del error SQLITE_READONLY |
