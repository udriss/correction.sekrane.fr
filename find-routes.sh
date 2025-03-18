#!/bin/bash
# Find all Next.js page files with dynamic routes
echo "Files with [code] parameter:"
grep -r "\[code\]" --include="*.tsx" --include="*.ts" /var/www/correction.sekrane.fr/app/

echo -e "\nFiles with [id] parameter:"
grep -r "\[id\]" --include="*.tsx" --include="*.ts" /var/www/correction.sekrane.fr/app/
