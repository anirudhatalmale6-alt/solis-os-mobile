from playwright.sync_api import sync_playwright
import base64

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS'
ICON_PATH = f'{OUTDIR}/playstore-icon-512.png'

with open(ICON_PATH, 'rb') as f:
    icon_b64 = base64.b64encode(f.read()).decode()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1024, "height": 500})
    page.set_content(f"""<!DOCTYPE html>
<html><head><style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1024px; height: 500px; overflow: hidden; font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; }}
.banner {{
    width: 1024px; height: 500px;
    background: linear-gradient(135deg, #08080d 0%, #111120 40%, #0d0d18 70%, #08080d 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
}}
.glow1 {{ position: absolute; top: -100px; left: -50px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%); }}
.glow2 {{ position: absolute; bottom: -80px; right: 50px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(59,100,246,0.08) 0%, transparent 70%); }}
.line-accent {{ position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #f59e0b, #3b64f6, transparent); }}
.content {{ display: flex; align-items: center; gap: 40px; position: relative; z-index: 2; }}
.logo-container {{
    width: 140px; height: 140px;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(245,158,11,0.2);
    flex-shrink: 0;
}}
.logo-container img {{ width: 100%; height: 100%; object-fit: cover; }}
.text-block {{ display: flex; flex-direction: column; gap: 8px; }}
.app-name {{
    font-size: 56px; font-weight: 800;
    background: linear-gradient(90deg, #f0f0f5, #d0d0dd);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -1px;
}}
.tagline {{
    font-size: 22px; font-weight: 500;
    background: linear-gradient(90deg, #f59e0b, #f97316);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}}
.features {{ display: flex; gap: 16px; margin-top: 6px; font-size: 14px; }}
.features span {{
    padding: 5px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; color: #9999aa;
}}
</style></head>
<body>
<div class="banner">
    <div class="glow1"></div><div class="glow2"></div><div class="line-accent"></div>
    <div class="content">
        <div class="logo-container"><img src="data:image/png;base64,{icon_b64}" /></div>
        <div class="text-block">
            <div class="app-name">Solis OS</div>
            <div class="tagline">AI-Powered Business Management</div>
            <div class="features">
                <span>Bookings</span><span>CRM</span><span>WhatsApp AI</span><span>Analytics</span><span>Marketing</span>
            </div>
        </div>
    </div>
</div>
</body></html>""")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUTDIR}/playstore-feature-graphic.png")
    print("Created feature graphic")
    page.close()
    browser.close()
