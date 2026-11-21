#!/bin/sh
# Builds index.html from the files in src/.
cd "$(dirname "$0")"
{
cat <<'H'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2f5d50">
<title>SILVER Register</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap">
H
cat src/style.css
cat <<'H'
</style></head>
<body>
<div class="bar"><div class="wrap">
  <div class="brand">SILVER Register<small id="who"></small></div>
  <select id="role" aria-label="User"></select>
</div><div class="wrap"><nav id="nav"></nav></div></div>
<main class="wrap" id="app"></main>
<script>
H
cat src/data.js src/vol.js src/ui.js
printf '</script>\n</body>\n</html>\n'
} > index.html
