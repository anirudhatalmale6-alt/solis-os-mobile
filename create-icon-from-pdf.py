from PIL import Image
import subprocess, os

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS'
PDF_PATH = '/var/lib/freelancer/projects/40373506/Solis_OS_Logo_Icon.pdf'

# Convert PDF to high-res PNG using pdftoppm
subprocess.run([
    'pdftoppm', '-png', '-r', '600', '-singlefile',
    PDF_PATH, f'{OUTDIR}/logo_hires'
], check=True)

logo = Image.open(f'{OUTDIR}/logo_hires.png').convert('RGBA')
print(f"Logo size: {logo.size}")

# Find the bounding box of the non-white content
datas = list(logo.getdata())
w, h = logo.size
min_x, min_y, max_x, max_y = w, h, 0, 0

for y in range(h):
    for x in range(w):
        px = datas[y * w + x]
        if px[0] < 240 or px[1] < 240 or px[2] < 240:
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

print(f"Content bounds: ({min_x},{min_y}) to ({max_x},{max_y})")

# Crop to content with some padding
pad = 20
min_x = max(0, min_x - pad)
min_y = max(0, min_y - pad)
max_x = min(w, max_x + pad)
max_y = min(h, max_y + pad)

logo_cropped = logo.crop((min_x, min_y, max_x, max_y))

# Make white/near-white pixels transparent
logo_rgba = logo_cropped.copy()
pixels = logo_rgba.load()
cw, ch = logo_rgba.size
for y in range(ch):
    for x in range(cw):
        r, g, b, a = pixels[x, y]
        if r > 235 and g > 235 and b > 235:
            pixels[x, y] = (255, 255, 255, 0)
        elif r > 220 and g > 220 and b > 220:
            # Semi-transparent for near-white (anti-aliasing)
            alpha = int(255 * (1 - min(r, g, b) / 255))
            pixels[x, y] = (r, g, b, max(alpha, 30))

# Create 512x512 icon with dark background
icon = Image.new('RGBA', (512, 512), (8, 8, 13, 255))

# Add subtle glow
from PIL import ImageDraw, ImageFilter
glow = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
for r in range(180, 0, -2):
    alpha = int(12 * (r / 180))
    glow_draw.ellipse([256-r, 256-r, 256+r, 256+r], fill=(245, 158, 11, alpha))
icon = Image.alpha_composite(icon, glow)

# Resize logo to fit with padding
logo_w, logo_h = logo_rgba.size
max_dim = max(logo_w, logo_h)
scale = 360 / max_dim
new_w = int(logo_w * scale)
new_h = int(logo_h * scale)
logo_resized = logo_rgba.resize((new_w, new_h), Image.LANCZOS)

# Center
offset_x = (512 - new_w) // 2
offset_y = (512 - new_h) // 2
icon.paste(logo_resized, (offset_x, offset_y), logo_resized)

icon.save(f'{OUTDIR}/playstore-icon-512.png', 'PNG')
print(f"Created: playstore-icon-512.png")

# Clean up
os.remove(f'{OUTDIR}/logo_hires.png')
print("Done!")
