#!/bin/bash

# Script para atualizar versões de cache busting em todos os arquivos HTML
# Uso: ./update-versions.sh

# Gera um novo timestamp
NEW_VERSION=$(date +%s)

echo "🔄 Atualizando versões para: v=$NEW_VERSION"

# Lista de arquivos HTML para atualizar
HTML_FILES=("index.html" "escolhas.html" "account.html" "features.html" "ranking.html")

# Lista de arquivos que podem estar inclusos nos HTMLs
SCRIPT_FILES=("privacy-consent.js" "data-auditor.js" "security.js" "user-account.js" "login-system.js" "index.js" "escolhas.js" "account-page.js" "features.js" "ranking.js")
CSS_FILES=("escolhas.css")

for html_file in "${HTML_FILES[@]}"; do
    if [ -f "$html_file" ]; then
        echo "📝 Atualizando $html_file..."
        
        # Atualizar scripts JS
        for script in "${SCRIPT_FILES[@]}"; do
            # Substituir versões existentes
            sed -i.bak "s|$script?v=[0-9]*|$script?v=$NEW_VERSION|g" "$html_file"
            # Adicionar versão se não existir
            sed -i.bak "s|$script\"|$script?v=$NEW_VERSION\"|g" "$html_file"
        done
        
        # Atualizar CSS
        for css in "${CSS_FILES[@]}"; do
            sed -i.bak "s|$css?v=[0-9]*|$css?v=$NEW_VERSION|g" "$html_file"
            sed -i.bak "s|$css\"|$css?v=$NEW_VERSION\"|g" "$html_file"
        done
        
        # Remover arquivo de backup
        rm -f "$html_file.bak"
        
        echo "✅ $html_file atualizado"
    else
        echo "⚠️  $html_file não encontrado"
    fi
done

echo ""
echo "🎉 Todas as versões foram atualizadas para: v=$NEW_VERSION"
echo "💡 Agora execute: firebase deploy"
