# 📚 Documentación del Proyecto

Bienvenido a la documentación completa del Node Webhook Receiver. Aquí encontrarás todas las guías y referencias necesarias para trabajar con el proyecto.

## 📖 Guías disponibles

### 🔒 Seguridad
- [**Resolver Vulnerabilidades NPM**](RESOLVER-VULNERABILIDADES-NPM.md) - Guía completa para identificar y resolver vulnerabilidades de seguridad en dependencias de npm

### 📖 Referencia Técnica
- [**Refactorización WebSocket**](05-referencia/REFACTORIZACION-WEBSOCKET.md) - Documentación de cambios arquitectónicos v1.2.0
- [**Documentación Completada**](05-referencia/DOCUMENTACION-COMPLETADA.md) - Referencia completa de endpoints y código

### 🧪 Testing y Desarrollo
- [**Guía de Pruebas Prácticas**](GUIA-PRUEBAS-PRACTICAS.md) - ⭐ **EMPEZAR AQUÍ** - Guía paso a paso con ejemplos prácticos para probar el sistema
- [**Guía de Prueba para Desarrolladores**](GUIA-PRUEBA-DESARROLLADOR.md) - Documentación técnica detallada para desarrolladores
- [**Flujo de Prueba Completo**](FLUJO-PRUEBA-COMPLETO.md) - Proceso completo de testing automatizado del sistema
- [**Comandos de Referencia**](COMANDOS-REFERENCIA.md) - Lista de comandos útiles para el desarrollo

### 🐛 Solución de Problemas
- [**SQLITE_READONLY: Base de datos solo lectura**](SOLUCION-SQLITE-READONLY.md) - Solución al error "attempt to write a readonly database"
- [**Docker + SQLite3 en Windows**](SOLUCION-DOCKER-SQLITE3-WINDOWS.md) - Errores específicos de Docker con sqlite3 en Windows
- [**Docker Build - sqlite3**](SOLUCION-DOCKER-SQLITE3.md) - Problemas de compilación con sqlite3 en Docker

### 📋 Planificación
- [**Plan de Implementación**](plan%20de%20implementacion%20node-webhook-receiver.md) - Plan original de implementación del proyecto

## 🎯 Inicio rápido por caso de uso

### Quiero probar el sistema ahora mismo (¡Empezar aquí!)
👉 Lee: [GUIA-PRUEBAS-PRACTICAS.md](GUIA-PRUEBAS-PRACTICAS.md) ⭐

### Quiero enviar webhooks de prueba
👉 Lee: [GUIA-PRUEBAS-PRACTICAS.md](GUIA-PRUEBAS-PRACTICAS.md) - Sección "Enviar Webhooks Manualmente"

### Quiero resolver vulnerabilidades de npm
👉 Lee: [RESOLVER-VULNERABILIDADES-NPM.md](RESOLVER-VULNERABILIDADES-NPM.md)

### Necesito documentación técnica detallada
👉 Lee: [GUIA-PRUEBA-DESARROLLADOR.md](GUIA-PRUEBA-DESARROLLADOR.md)

### Necesito un comando específico
👉 Lee: [COMANDOS-REFERENCIA.md](COMANDOS-REFERENCIA.md)

### Quiero entender el flujo completo de pruebas automatizadas
👉 Lee: [FLUJO-PRUEBA-COMPLETO.md](FLUJO-PRUEBA-COMPLETO.md)

### Necesito entender los cambios recientes en la arquitectura
👉 Lee: [REFACTORIZACION-WEBSOCKET.md](05-referencia/REFACTORIZACION-WEBSOCKET.md)

### Tengo error "SQLITE_READONLY: attempt to write a readonly database"
👉 Lee: [SOLUCION-SQLITE-READONLY.md](SOLUCION-SQLITE-READONLY.md) ⚠️ Solución paso a paso

## 🔗 Enlaces útiles

- [README principal del proyecto](../README.md)
- [Código fuente](../src/)
- [Scripts de utilidad](../scripts/)
- [Configuración de Docker](../docker/)

## 🆘 ¿Necesitas ayuda?

1. **Primero**: Revisa la documentación relevante arriba
2. **Luego**: Consulta el [README principal](../README.md)
3. **Si aún tienes problemas**: Abre un issue en GitHub

## 📝 Contribuir a la documentación

Si encuentras errores o quieres mejorar la documentación:

1. Los archivos están en formato Markdown (`.md`)
2. Sigue el estilo y formato de los documentos existentes
3. Incluye ejemplos prácticos cuando sea posible
4. Actualiza este índice si agregas nuevos documentos

---

## 📝 Changelog Reciente

### v1.2.1 (2026-02-10)
- ✅ **Fix**: Solución documentada para error `SQLITE_READONLY: attempt to write a readonly database`
- ✅ **Docs**: Nueva guía completa [SOLUCION-SQLITE-READONLY.md](SOLUCION-SQLITE-READONLY.md)
- ✅ **Docs**: Actualizados nombres de contenedores Docker en toda la documentación

### v1.2.0 (2026-02-10)
- ✅ **Refactorización WebSocket**: Módulo independiente para evitar dependencias circulares
- ✅ **Fix**: Resuelto error `broadcastUpdate is not a function`
- ✅ **Docs**: Actualizada toda la documentación técnica

---

**Última actualización**: Febrero 2026
