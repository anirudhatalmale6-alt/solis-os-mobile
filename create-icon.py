from PIL import Image, ImageDraw
import os

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS'
LOGO_PATH = '/var/lib/freelancer/projects/40373506/ChatGPT Image May 17, 2026, 09_46_29 PM.jpg'

logo = Image.open(LOGO_PATH).convert('RGBA')

# Create 512x512 icon with dark background
icon = Image.new('RGBA', (512, 512), (8, 8, 13, 255))

# Add subtle radial glow effect
glow = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
center = 256
for r in range(200, 0, -1):
    alpha = int(15 * (r / 200))
    glow_draw.ellipse(
        [center - r, center - r, center + r, center + r],
        fill=(245, 158, 11, alpha)
    )
icon = Image.alpha_composite(icon, glow)

# The logo has white background - need to make white pixels transparent
logo_rgba = logo.copy()
datas = logo_rgba.getdata()
new_data = []
for item in datas:
    # Make near-white pixels transparent
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
logo_rgba.putdata(new_data)

# Resize logo to fit nicely in 512x512 with padding
logo_size = 380
logo_rgba = logo_rgba.resize((logo_size, logo_size), Image.LANCZOS)

# Center the logo
offset_x = (512 - logo_size) // 2
offset_y = (512 - logo_size) // 2
icon.paste(logo_rgba, (offset_x, offset_y), logo_rgba)

# Save as PNG
icon_path = os.path.join(OUTDIR, 'playstore-icon-512.png')
icon.save(icon_path, 'PNG')
print(f"Created icon: {icon_path}")

# Also save as a round-corner version (Google Play applies its own mask, so square is fine)
print("Done!")
