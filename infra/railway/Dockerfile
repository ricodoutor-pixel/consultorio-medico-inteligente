# 🚂 Railway — Evolution API (WhatsApp Brisa Bot)
# Imagem oficial multi-arch validada. Sem build custom: Railway só roda.
FROM evoapicloud/evolution-api:v2.3.7

# Railway injeta PORT dinamicamente; Evolution lê de 8080 por padrão.
# O proxy do Railway redireciona automaticamente — não precisa setar.
EXPOSE 8080

# Volume montado via UI do Railway em /evolution/instances (sessões Baileys).
VOLUME ["/evolution/instances"]
