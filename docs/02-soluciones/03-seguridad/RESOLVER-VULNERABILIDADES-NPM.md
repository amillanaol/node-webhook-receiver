# Guía para Resolver Vulnerabilidades de npm

Esta guía te ayudará a identificar y resolver vulnerabilidades de seguridad en dependencias de npm de manera efectiva.

## Tabla de Contenidos

- [¿Qué son las vulnerabilidades de npm?](#qué-son-las-vulnerabilidades-de-npm)
- [Identificar vulnerabilidades](#identificar-vulnerabilidades)
- [Métodos de resolución](#métodos-de-resolución)
- [Solución con npm overrides](#solución-con-npm-overrides)
- [Casos especiales](#casos-especiales)
- [Prevención y buenas prácticas](#prevención-y-buenas-prácticas)

---

## ¿Qué son las vulnerabilidades de npm?

Las vulnerabilidades de npm son problemas de seguridad conocidos en paquetes de Node.js. Pueden clasificarse en:

- **Critical**: Requieren atención inmediata, pueden comprometer completamente tu aplicación
- **High**: Problemas serios que deben resolverse pronto
- **Moderate**: Problemas que deben abordarse pero con menor urgencia
- **Low**: Riesgos menores, pero vale la pena resolverlos

### Tipos de dependencias afectadas

1. **Dependencias directas**: Paquetes que instalas explícitamente en tu `package.json`
2. **Dependencias transitivas**: Paquetes requeridos por tus dependencias directas
3. **DevDependencies**: Dependencias solo para desarrollo (menor riesgo en producción)

---

## Identificar vulnerabilidades

### Comando básico de auditoría

```bash
npm audit
```

Este comando muestra:
- Número total de vulnerabilidades
- Severidad de cada una
- Cadena de dependencias afectadas
- Sugerencias de corrección

### Auditoría en formato JSON

```bash
npm audit --json
```

Útil para análisis automatizado o integración con CI/CD.

### Ver solo vulnerabilidades de producción

```bash
npm audit --production
```

Ignora las vulnerabilidades en devDependencies.

---

## Métodos de resolución

### Nivel 1: Corrección automática (Método más simple)

```bash
npm audit fix
```

**¿Cuándo usar?**
- Primera opción siempre
- Cuando las vulnerabilidades están en dependencias directas
- Actualizaciones compatibles disponibles

**Limitaciones:**
- Solo actualiza dentro del rango de versión especificado en `package.json`
- No funciona con dependencias transitivas profundas

### Nivel 2: Corrección forzada

```bash
npm audit fix --force
```

**¿Cuándo usar?**
- Cuando `npm audit fix` no resuelve el problema
- Estás dispuesto a aceptar cambios breaking

**⚠️ Advertencias:**
- Puede actualizar a versiones con cambios incompatibles
- Puede romper tu aplicación
- **Siempre ejecuta las pruebas después**: `npm test`

### Nivel 3: Actualización manual de paquetes

```bash
# Ver versiones disponibles
npm view <nombre-paquete> versions

# Actualizar a última versión
npm install <nombre-paquete>@latest

# Actualizar a versión específica
npm install <nombre-paquete>@x.x.x
```

**¿Cuándo usar?**
- Cuando sabes exactamente qué paquete necesita actualizarse
- Quieres controlar la versión específica a instalar

### Nivel 4: npm overrides (Método avanzado)

**¿Cuándo usar?**
- Vulnerabilidades en dependencias transitivas que no se resuelven con métodos anteriores
- Necesitas forzar una versión específica de un paquete en toda la cadena de dependencias
- El paquete padre (ej. sqlite3) aún no actualiza sus dependencias

**Pasos:**

1. **Identifica el paquete problemático**

```bash
npm audit
```

Ejemplo de salida:
```
tar  <=7.5.6
Severity: high
node_modules/tar
  cacache  14.0.0 - 18.0.4
  Depends on vulnerable versions of tar
  node_modules/cacache
    make-fetch-happen  7.1.1 - 14.0.0
    node_modules/make-fetch-happen
      node-gyp  <=10.3.1
      node_modules/node-gyp
        sqlite3  >=5.0.0
        node_modules/sqlite3
```

2. **Verifica versiones seguras disponibles**

```bash
npm view tar versions --json
npm view node-gyp versions --json
```

3. **Agrega la sección `overrides` en `package.json`**

```json
{
  "name": "tu-proyecto",
  "version": "1.0.0",
  "dependencies": {
    "sqlite3": "^5.0.2"
  },
  "overrides": {
    "tar": "^7.5.7",
    "node-gyp": "^11.0.0"
  }
}
```

4. **Elimina node_modules y package-lock.json**

```bash
rm -rf node_modules package-lock.json
```

En Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
```

5. **Reinstala las dependencias**

```bash
npm install
```

6. **Verifica que se resolvieron las vulnerabilidades**

```bash
npm audit
```

Deberías ver:
```
found 0 vulnerabilities
```

7. **Ejecuta las pruebas**

```bash
npm test
```

---

## Solución con npm overrides

### Ejemplo completo del caso real (sqlite3 + tar)

**Problema:**
```
5 high severity vulnerabilities
- tar <=7.5.6 (vulnerable)
- Usado por node-gyp
- Usado por sqlite3
```

**Solución:**

```json
{
  "overrides": {
    "tar": "^7.5.7",
    "node-gyp": "^11.0.0"
  }
}
```

### ¿Cómo funcionan los overrides?

Los `overrides` le dicen a npm: "Sin importar qué versión pida cualquier paquete, usa esta versión específica para este paquete en todo el árbol de dependencias".

### Sintaxis de overrides

```json
{
  "overrides": {
    // Override global
    "paquete": "^1.2.3",

    // Override solo cuando es requerido por un paquete específico
    "paquete-padre": {
      "paquete-hijo": "^2.0.0"
    },

    // Override anidado
    "nivel1": {
      "nivel2": {
        "nivel3": "^3.0.0"
      }
    }
  }
}
```

### Ventajas de overrides

✅ Resuelve vulnerabilidades en dependencias transitivas profundas
✅ No requiere esperar actualizaciones del paquete padre
✅ Control total sobre versiones específicas
✅ Compatible con npm 8.3.0+

### Desventajas de overrides

⚠️ Puede causar incompatibilidades si la versión forzada no es compatible
⚠️ Responsabilidad del desarrollador mantener las versiones actualizadas
⚠️ Puede ocultar problemas de compatibilidad

---

## Casos especiales

### Vulnerabilidad en devDependencies

Si la vulnerabilidad solo está en devDependencies y no afecta producción:

1. **Evalúa el riesgo**: ¿Realmente necesitas solucionarlo ahora?
2. **Opciones:**
   - Actualizar el paquete si hay versión compatible
   - Usar overrides si es crítico
   - Documentar y planificar para más adelante

### Ninguna corrección disponible

Si npm dice "No fix available":

1. **Verifica GitHub del paquete**: ¿Hay issue abierto? ¿Hay PR pendiente?
2. **Opciones:**
   - Esperar a que el mantenedor lance una corrección
   - Buscar paquetes alternativos
   - Hacer fork y arreglar tú mismo (último recurso)
   - Usar overrides si la vulnerabilidad está en dependencias transitivas

### Vulnerabilidades múltiples entrelazadas

Cuando varios paquetes se afectan entre sí:

1. **Identifica el paquete raíz** (el más alto en la cadena)
2. **Actualiza de arriba hacia abajo**
3. **Usa overrides para los que no tienen solución directa**

---

## Prevención y buenas prácticas

### 1. Auditorías regulares

```bash
# En desarrollo, ejecuta periódicamente
npm audit

# En CI/CD, falla el build si hay vulnerabilidades críticas
npm audit --audit-level=high
```

### 2. Mantén las dependencias actualizadas

```bash
# Ver paquetes desactualizados
npm outdated

# Actualizar dentro del rango de versión actual
npm update

# Actualizar a latest (con cuidado)
npm update <paquete>@latest
```

### 3. Usa rangos de versión apropiados

```json
{
  "dependencies": {
    "express": "^4.18.2",     // ✅ Permite actualizaciones menores y parches
    "lodash": "4.17.21",      // ⚠️ Versión fija, no se actualizará automáticamente
    "axios": "~1.6.0"         // ⚠️ Solo permite actualizaciones de parche
  }
}
```

**Recomendación**: Usa `^` (caret) para la mayoría de dependencias.

### 4. Lockfiles en control de versión

✅ **SIEMPRE** incluye `package-lock.json` en git

```bash
git add package-lock.json
git commit -m "Update package-lock.json"
```

Beneficios:
- Builds reproducibles
- Equipo usa las mismas versiones
- Más fácil detectar cuándo cambian las dependencias

### 5. Verifica antes de instalar

Antes de agregar una nueva dependencia:

```bash
# Ver información del paquete
npm view <paquete>

# Ver versiones disponibles
npm view <paquete> versions

# Ver dependencias del paquete
npm view <paquete> dependencies

# Ver último commit y mantenimiento
npm view <paquete> time
```

**Señales de alerta:**
- Última actualización hace más de 2 años
- Muchas vulnerabilidades conocidas
- Pocas descargas semanales
- Sin repositorio o documentación

### 6. Configura Dependabot o Renovate

En GitHub, habilita Dependabot para recibir PRs automáticos con actualizaciones de seguridad.

**.github/dependabot.yml**:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 7. Scripts útiles en package.json

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:check": "npm audit --audit-level=moderate",
    "outdated": "npm outdated",
    "update:deps": "npm update && npm audit fix"
  }
}
```

### 8. Política de actualización

**Recomendación de frecuencia:**
- **Parches de seguridad**: Inmediatamente
- **Versiones menores**: Semanalmente o quincenalmente
- **Versiones mayores**: Cuando haya tiempo para testing completo

---

## Checklist de resolución de vulnerabilidades

```markdown
- [ ] 1. Ejecutar `npm audit` para identificar vulnerabilidades
- [ ] 2. Intentar `npm audit fix` primero
- [ ] 3. Si no funciona, intentar `npm audit fix --force`
- [ ] 4. Si aún persisten, identificar dependencias transitivas afectadas
- [ ] 5. Verificar versiones seguras disponibles
- [ ] 6. Agregar `overrides` en package.json si es necesario
- [ ] 7. Eliminar node_modules y package-lock.json
- [ ] 8. Ejecutar `npm install`
- [ ] 9. Verificar con `npm audit` que se resolvieron (0 vulnerabilities)
- [ ] 10. Ejecutar todas las pruebas: `npm test`
- [ ] 11. Probar la aplicación manualmente en local
- [ ] 12. Crear commit con los cambios
- [ ] 13. Desplegar en staging primero (si aplica)
- [ ] 14. Documentar cualquier cambio en comportamiento
```

---

## Recursos adicionales

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [npm overrides documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides)
- [GitHub Advisory Database](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [Common Vulnerabilities and Exposures (CVE)](https://cve.mitre.org/)

---

## Ejemplo práctico completo

### Escenario

Recibes este error al ejecutar `npm audit`:

```
5 high severity vulnerabilities

tar  <=7.5.6
Severity: high
node-tar is Vulnerable to Arbitrary File Overwrite
fix available via `npm audit fix`
node_modules/tar
  cacache  14.0.0 - 18.0.4
  Depends on vulnerable versions of tar
    make-fetch-happen  7.1.1 - 14.0.0
    Depends on vulnerable versions of cacache
      node-gyp  <=10.3.1
      Depends on vulnerable versions of make-fetch-happen
        sqlite3  >=5.0.0
        Depends on vulnerable versions of node-gyp
```

### Solución paso a paso

**1. Intentar solución automática**
```bash
npm audit fix
```
Resultado: No resuelve el problema (dependencias transitivas)

**2. Intentar solución forzada**
```bash
npm audit fix --force
```
Resultado: Tampoco funciona

**3. Verificar versiones seguras**
```bash
npm view tar versions --json | tail -5
# ["7.4.0", "7.4.1", "7.4.2", "7.4.3", "7.5.7"]

npm view node-gyp versions --json | tail -5
# ["10.1.0", "10.2.0", "11.0.0", "11.0.1"]
```

**4. Actualizar package.json**
```json
{
  "dependencies": {
    "sqlite3": "^5.0.2"
  },
  "overrides": {
    "tar": "^7.5.7",
    "node-gyp": "^11.0.0"
  }
}
```

**5. Reinstalar dependencias**
```bash
rm -rf node_modules package-lock.json
npm install
```

**6. Verificar**
```bash
npm audit
# found 0 vulnerabilities ✅

npm test
# All tests passing ✅
```

**7. Commit**
```bash
git add package.json package-lock.json
git commit -m "fix: resolve npm security vulnerabilities using overrides

- Added overrides for tar (^7.5.7) and node-gyp (^11.0.0)
- Resolves 5 high severity vulnerabilities in tar package
- All tests passing after dependency updates"
```

---

## Preguntas frecuentes (FAQ)

### ¿Es seguro usar npm overrides?

Sí, siempre que:
- Verifiques que la versión forzada es compatible
- Ejecutes todas las pruebas después
- Documentes por qué usas overrides
- Revises periódicamente si aún son necesarios

### ¿Debo resolver todas las vulnerabilidades?

Prioriza así:
1. **Critical/High en producción**: Resolver inmediatamente
2. **Moderate en producción**: Resolver en la próxima semana
3. **Low en producción**: Planificar para próximo sprint
4. **DevDependencies**: Evaluar riesgo vs esfuerzo

### ¿Qué hago si npm audit fix rompe mi aplicación?

```bash
# Revertir cambios
git checkout package.json package-lock.json
rm -rf node_modules
npm install

# Revisar qué cambió
npm audit fix --dry-run

# Aplicar correcciones una por una si es necesario
```

### ¿Cada cuánto debo ejecutar npm audit?

- **Local**: Al menos semanalmente
- **CI/CD**: En cada push/PR
- **Producción**: Mensualmente como auditoría general

---

**Última actualización**: Febrero 2026
**Versión de npm requerida para overrides**: 8.3.0+
**Compatibilidad**: Node.js 16+
