#!/bin/bash
# Script para sincronizar automáticamente el código con GitHub

echo "🚀 Iniciando despliegue a GitHub..."

# 1. Ejecutar tests unitarios (Fail-Fast)
echo "🧪 Ejecutando pruebas unitarias..."
npm run test
if [ $? -ne 0 ]; then
    echo "❌ Error en los Tests. Has roto alguna función. Abortando deploy."
    exit 1
fi

# 2. Ejecutar el build para asegurar que no hay errores de sintaxis
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en el empaquetado (build). Revisa tu código. Abortando deploy."
    exit 1
fi

# 3. Agregar todos los cambios respetando el .gitignore
git add .

# 3. Hacer commit con mensaje autogenerado (ignora si no hay cambios)
COMMIT_MSG="Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG" || echo "⚠️ No hay cambios nuevos para commitear."

# 4. Subir los cambios a la rama main
git push origin main

echo "✅ Código subido exitosamente a GitHub."