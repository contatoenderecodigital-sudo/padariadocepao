#!/usr/bin/env bash
# ============================================================================
#  BACKUP DIÁRIO DO BANCO — pg_dump comprimido, com retenção.
#  Roda no servidor (aaPanel). Agende no cron (ex: todo dia 3h da manhã):
#     0 3 * * *  /caminho/backup.sh  >> /var/log/docepao-backup.log 2>&1
#
#  ⚠️ Backup que nunca foi restaurado NÃO É backup. Teste o restore (ver embaixo).
#     Melhor ainda: mande uma cópia pra FORA do servidor (outro lugar), senão
#     se o VPS morrer, o backup morre junto.
# ============================================================================
set -euo pipefail

# --- Config (ajuste) ---
BANCO="${PGDATABASE:-docepao}"
USUARIO="${PGUSER:-postgres}"
DESTINO="${BACKUP_DIR:-/root/backups/docepao}"
RETENCAO_DIAS="${BACKUP_RETENCAO:-14}"   # quantos dias de backup guardar

# --- Backup ---
mkdir -p "$DESTINO"
CARIMBO=$(date +%Y-%m-%d_%H%M%S)
ARQUIVO="$DESTINO/docepao_$CARIMBO.sql.gz"

echo "[$(date)] iniciando backup de '$BANCO' -> $ARQUIVO"
pg_dump -U "$USUARIO" "$BANCO" | gzip > "$ARQUIVO"
echo "[$(date)] backup ok ($(du -h "$ARQUIVO" | cut -f1))"

# --- Retenção: apaga os mais velhos que RETENCAO_DIAS ---
find "$DESTINO" -name 'docepao_*.sql.gz' -mtime +"$RETENCAO_DIAS" -delete
echo "[$(date)] limpeza feita (mantendo $RETENCAO_DIAS dias)"

# ============================================================================
#  COMO TESTAR O RESTORE (faça isso pelo menos uma vez, num banco de teste):
#    createdb -U postgres docepao_teste
#    gunzip -c /root/backups/docepao/docepao_2026-07-27_030000.sql.gz \
#      | psql -U postgres docepao_teste
#    # depois confere se as tabelas/pedidos estão lá, e apaga: dropdb docepao_teste
#
#  ALTERNATIVA (recomendada além deste script): use o BACKUP NATIVO do aaPanel
#  (App Store -> agendamento de backup do PostgreSQL) e configure envio pra
#  um storage externo (Google Drive / S3). Dois backups > um.
# ============================================================================
