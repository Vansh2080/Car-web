import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<span class="spec-chip"><strong>Type</strong> Concept Coupe</span>',
    '<span class="spec-chip"><strong>Type</strong> PHANTOM</span>'
)
html = html.replace(
    '<span class="spec-chip"><strong>Source</strong> Sketchfab</span>',
    ''
)
html = html.replace(
    '<div class="spec-item"><span class="spec-label">Type</span><span class="spec-value">Concept Coupe</span></div>',
    '<div class="spec-item"><span class="spec-label">Type</span><span class="spec-value">PHANTOM</span></div>'
)
html = html.replace(
    '<div class="spec-item"><span class="spec-label">Source</span><span class="spec-value">Sketchfab</span></div>',
    ''
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Text replacements completed.")
