# Script de vérification de compatibilité - Windows PowerShell
# Vérifie tous les prérequis pour exécuter le projet

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VÉRIFICATION DE COMPATIBILITÉ" -ForegroundColor Cyan
Write-Host "  Projet Merchandising Samsung" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Vérifier Java
Write-Host "[1/6] Vérification de Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    if ($javaVersion -match "version ""(1[7-9]|2[0-9])") {
        Write-Host "  ✓ Java trouvé : $javaVersion" -ForegroundColor Green
    } else {
        $warnings += "Java version doit être 17 ou supérieur. Version trouvée : $javaVersion"
        Write-Host "  ⚠ Version Java peut être incompatible" -ForegroundColor Yellow
    }
} catch {
    $errors += "Java n'est pas installé ou pas dans le PATH"
    Write-Host "  ✗ Java non trouvé" -ForegroundColor Red
}

# 2. Vérifier Maven (optionnel, car Maven Wrapper existe)
Write-Host "[2/6] Vérification de Maven..." -ForegroundColor Yellow
try {
    $mvnVersion = mvn -version 2>&1 | Select-String "Apache Maven"
    Write-Host "  ✓ Maven trouvé : $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Maven non trouvé (Maven Wrapper sera utilisé)" -ForegroundColor Yellow
}

# Vérifier Maven Wrapper
if (Test-Path "mvnw.cmd") {
    Write-Host "  ✓ Maven Wrapper présent (mvnw.cmd)" -ForegroundColor Green
} else {
    $warnings += "Maven Wrapper (mvnw.cmd) non trouvé"
    Write-Host "  ⚠ Maven Wrapper non trouvé" -ForegroundColor Yellow
}

# 3. Vérifier Node.js
Write-Host "[3/6] Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 18) {
        Write-Host "  ✓ Node.js trouvé : $nodeVersion" -ForegroundColor Green
    } else {
        $warnings += "Node.js version doit être 18 ou supérieur. Version trouvée : $nodeVersion"
        Write-Host "  ⚠ Node.js version : $nodeVersion (18+ recommandé)" -ForegroundColor Yellow
    }
} catch {
    $errors += "Node.js n'est pas installé ou pas dans le PATH"
    Write-Host "  ✗ Node.js non trouvé" -ForegroundColor Red
}

# 4. Vérifier npm
Write-Host "[4/6] Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  ✓ npm trouvé : $npmVersion" -ForegroundColor Green
} catch {
    $errors += "npm n'est pas installé ou pas dans le PATH"
    Write-Host "  ✗ npm non trouvé" -ForegroundColor Red
}

# 5. Vérifier PostgreSQL
Write-Host "[5/6] Vérification de PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>&1
    if ($pgVersion -match "psql") {
        Write-Host "  ✓ PostgreSQL trouvé : $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ PostgreSQL peut ne pas être dans le PATH" -ForegroundColor Yellow
    }
} catch {
    $warnings += "PostgreSQL peut ne pas être installé ou pas dans le PATH"
    Write-Host "  ⚠ PostgreSQL non trouvé dans PATH (peut être installé mais pas dans PATH)" -ForegroundColor Yellow
}

# 6. Vérifier les fichiers de configuration
Write-Host "[6/6] Vérification des fichiers de configuration..." -ForegroundColor Yellow

if (Test-Path "pom.xml") {
    Write-Host "  ✓ pom.xml trouvé" -ForegroundColor Green
    
    # Vérifier la version Spring Boot
    $pomContent = Get-Content "pom.xml" -Raw
    if ($pomContent -match 'spring-boot-starter-parent.*version.*3\.5\.10') {
        $warnings += "Spring Boot 3.5.10 peut ne pas exister. Recommandé : 3.3.5 ou 3.2.13"
        Write-Host "  ⚠ Spring Boot 3.5.10 détecté (version peut être incorrecte)" -ForegroundColor Yellow
    }
} else {
    $errors += "pom.xml non trouvé"
    Write-Host "  ✗ pom.xml non trouvé" -ForegroundColor Red
}

if (Test-Path "samsung-merch-app/package.json") {
    Write-Host "  ✓ package.json trouvé" -ForegroundColor Green
} else {
    $warnings += "package.json non trouvé dans samsung-merch-app/"
    Write-Host "  ⚠ package.json non trouvé" -ForegroundColor Yellow
}

if (Test-Path "src/main/resources/application.properties") {
    Write-Host "  ✓ application.properties trouvé" -ForegroundColor Green
    
    # Vérifier le mot de passe
    $appProps = Get-Content "src/main/resources/application.properties"
    if ($appProps -match "password=kakakiki") {
        Write-Host "  ✓ Mot de passe PostgreSQL configuré : kakakiki" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Vérifier le mot de passe PostgreSQL dans application.properties" -ForegroundColor Yellow
    }
} else {
    $errors += "application.properties non trouvé"
    Write-Host "  ✗ application.properties non trouvé" -ForegroundColor Red
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "✓ Aucune erreur critique détectée" -ForegroundColor Green
} else {
    Write-Host "✗ Erreurs critiques détectées :" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠ Avertissements :" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Corriger les erreurs critiques ci-dessus" -ForegroundColor White
Write-Host "2. Consulter VERIFICATION_COMPATIBILITE.md pour les détails" -ForegroundColor White
Write-Host "3. Mettre à jour Spring Boot vers 3.3.5 dans pom.xml si nécessaire" -ForegroundColor White
Write-Host "4. Installer les dépendances :" -ForegroundColor White
Write-Host "   Backend  : ./mvnw clean install" -ForegroundColor Cyan
Write-Host "   Frontend : cd samsung-merch-app && npm install" -ForegroundColor Cyan
Write-Host ""
