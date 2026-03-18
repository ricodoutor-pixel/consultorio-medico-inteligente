#!/bin/bash

# ========================================
# VALIDATE PRODUCTION CREDENTIALS
# ========================================
# This script validates all required credentials before deployment

set -e

echo "🔐 VALIDATING PRODUCTION CREDENTIALS"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# ========================================
# FUNCTION: Check if variable is set
# ========================================
check_env_var() {
  local var_name=$1
  local var_value=${!var_name}
  
  if [ -z "$var_value" ]; then
    echo -e "${RED}✗${NC} $var_name: NOT SET"
    ((FAILED++))
    return 1
  else
    echo -e "${GREEN}✓${NC} $var_name: SET"
    ((PASSED++))
    return 0
  fi
}

# ========================================
# FUNCTION: Validate format
# ========================================
validate_format() {
  local var_name=$1
  local var_value=${!var_name}
  local pattern=$2
  
  if [[ $var_value =~ $pattern ]]; then
    echo -e "${GREEN}✓${NC} $var_name: VALID FORMAT"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $var_name: INVALID FORMAT"
    ((FAILED++))
    return 1
  fi
}

# ========================================
# MERCADO PAGO
# ========================================
echo "📦 Mercado Pago"
check_env_var "VITE_MERCADO_PAGO_PUBLIC_KEY"
check_env_var "MERCADO_PAGO_ACCESS_TOKEN"
echo ""

# ========================================
# TWILIO
# ========================================
echo "📱 Twilio"
check_env_var "TWILIO_ACCOUNT_SID"
check_env_var "TWILIO_AUTH_TOKEN"
check_env_var "TWILIO_WHATSAPP_NUMBER"
check_env_var "TWILIO_SMS_NUMBER"

# Validate phone format
if [ ! -z "$TWILIO_WHATSAPP_NUMBER" ]; then
  validate_format "TWILIO_WHATSAPP_NUMBER" "^\+55[0-9]{10,11}$"
fi
echo ""

# ========================================
# JITSI
# ========================================
echo "🎥 Jitsi"
check_env_var "VITE_JITSI_DOMAIN"
check_env_var "VITE_JITSI_ROOM_PREFIX"
echo ""

# ========================================
# GOOGLE MAPS
# ========================================
echo "🗺️  Google Maps"
check_env_var "VITE_GOOGLE_MAPS_API_KEY"
echo ""

# ========================================
# CLICKSIGN
# ========================================
echo "🔏 Clicksign"
check_env_var "CLICKSIGN_API_KEY"
check_env_var "CLICKSIGN_SANDBOX_MODE"
echo ""

# ========================================
# DATABASE
# ========================================
echo "🗄️  Database"
check_env_var "DATABASE_URL"
check_env_var "DATABASE_HOST"
check_env_var "DATABASE_PORT"
check_env_var "DATABASE_USER"
check_env_var "DATABASE_NAME"
echo ""

# ========================================
# REDIS
# ========================================
echo "⚡ Redis"
check_env_var "REDIS_URL"
check_env_var "REDIS_HOST"
check_env_var "REDIS_PORT"
echo ""

# ========================================
# JWT & SECURITY
# ========================================
echo "🔐 JWT & Security"
check_env_var "JWT_SECRET"
check_env_var "SESSION_SECRET"
echo ""

# ========================================
# MANUS INTEGRATIONS
# ========================================
echo "🔗 Manus Integrations"
check_env_var "VITE_APP_ID"
check_env_var "OAUTH_SERVER_URL"
check_env_var "VITE_OAUTH_PORTAL_URL"
check_env_var "BUILT_IN_FORGE_API_URL"
check_env_var "BUILT_IN_FORGE_API_KEY"
echo ""

# ========================================
# MONITORING
# ========================================
echo "📊 Monitoring"
check_env_var "PROMETHEUS_ENABLED"
check_env_var "GRAFANA_ENABLED"
echo ""

# ========================================
# ENVIRONMENT
# ========================================
echo "🌍 Environment"
check_env_var "NODE_ENV"
check_env_var "VITE_APP_TITLE"
check_env_var "APP_URL"
check_env_var "API_URL"
echo ""

# ========================================
# OWNER INFORMATION
# ========================================
echo "👤 Owner Information"
check_env_var "OWNER_NAME"
check_env_var "OWNER_OPEN_ID"
check_env_var "OWNER_EMAIL"
echo ""

# ========================================
# SUMMARY
# ========================================
echo "===================================="
echo "VALIDATION SUMMARY"
echo "===================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CREDENTIALS VALIDATED SUCCESSFULLY${NC}"
  echo ""
  echo "You can proceed with deployment!"
  exit 0
else
  echo -e "${RED}❌ SOME CREDENTIALS ARE MISSING OR INVALID${NC}"
  echo ""
  echo "Please check your .env file and try again."
  exit 1
fi
