#!/bin/bash

# ========================================
# SMOKE TESTS - POST DEPLOYMENT
# ========================================
# Quick validation that the app is working

set -e

echo "🧪 RUNNING SMOKE TESTS"
echo "======================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
TIMEOUT=10
PASSED=0
FAILED=0

# ========================================
# FUNCTION: Test endpoint
# ========================================
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_code=${3:-200}
  
  echo -n "Testing $method $endpoint... "
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" "$APP_URL$endpoint" -m $TIMEOUT)
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✓ ($http_code)${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ (Expected $expected_code, got $http_code)${NC}"
    ((FAILED++))
  fi
}

# ========================================
# FUNCTION: Test database connection
# ========================================
test_database() {
  echo -n "Testing database connection... "
  
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠ DATABASE_URL not set${NC}"
    return
  fi
  
  # Try to connect (this is a simple check)
  if timeout 5 bash -c "echo > /dev/tcp/${DATABASE_HOST:-localhost}/${DATABASE_PORT:-3306}" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
  fi
}

# ========================================
# FUNCTION: Test Redis connection
# ========================================
test_redis() {
  echo -n "Testing Redis connection... "
  
  if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠ REDIS_URL not set${NC}"
    return
  fi
  
  # Try to connect
  if timeout 5 bash -c "echo > /dev/tcp/${REDIS_HOST:-localhost}/${REDIS_PORT:-6379}" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
  fi
}

# ========================================
# FUNCTION: Test Prometheus
# ========================================
test_prometheus() {
  echo -n "Testing Prometheus... "
  
  response=$(curl -s -w "\n%{http_code}" http://localhost:9090/-/healthy -m 5)
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠ (Prometheus not available)${NC}"
  fi
}

# ========================================
# FUNCTION: Test Grafana
# ========================================
test_grafana() {
  echo -n "Testing Grafana... "
  
  response=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health -m 5)
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠ (Grafana not available)${NC}"
  fi
}

# ========================================
# RUN TESTS
# ========================================

echo -e "${BLUE}API Endpoints${NC}"
echo "================================"
test_endpoint "/health" "GET" 200
test_endpoint "/api/health" "GET" 200
test_endpoint "/" "GET" 200
echo ""

echo -e "${BLUE}Authentication${NC}"
echo "================================"
test_endpoint "/api/auth/me" "GET" 200
echo ""

echo -e "${BLUE}Database & Cache${NC}"
echo "================================"
test_database
test_redis
echo ""

echo -e "${BLUE}Monitoring${NC}"
echo "================================"
test_prometheus
test_grafana
echo ""

# ========================================
# SUMMARY
# ========================================
echo "================================"
echo -e "${BLUE}SMOKE TEST SUMMARY${NC}"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED${NC}"
  echo ""
  echo "Application is ready for production!"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Please check the application logs and try again."
  exit 1
fi
