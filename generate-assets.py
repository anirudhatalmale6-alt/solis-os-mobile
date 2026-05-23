from playwright.sync_api import sync_playwright

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS'

with sync_playwright() as p:
    browser = p.chromium.launch()

    # 1. App Icon 512x512
    page = browser.new_page(viewport={"width": 512, "height": 512})
    page.set_content("""<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 512px; height: 512px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #08080d;
    border-radius: 108px;
}
.icon-wrap {
    width: 512px; height: 512px;
    background: linear-gradient(145deg, #0d0d15 0%, #08080d 50%, #0a0a12 100%);
    border-radius: 108px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
    overflow: hidden;
}
.icon-wrap::before {
    content: '';
    position: absolute;
    top: -50px; left: -50px; right: -50px; bottom: -50px;
    background: radial-gradient(circle at 35% 35%, rgba(245,158,11,0.12) 0%, transparent 60%);
}
.icon-wrap::after {
    content: '';
    position: absolute;
    bottom: -20px; right: -20px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
}
.letter {
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
    font-size: 280px;
    font-weight: 800;
    background: linear-gradient(160deg, #f59e0b 0%, #f97316 60%, #ea580c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 4px 30px rgba(245,158,11,0.3));
}
</style></head>
<body>
<div class="icon-wrap">
    <div class="letter">S</div>
</div>
</body></html>""")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUTDIR}/playstore-icon-512.png")
    print("Created: playstore-icon-512.png")
    page.close()

    # 2. Feature Graphic 1024x500
    page = browser.new_page(viewport={"width": 1024, "height": 500})
    page.set_content("""<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 1024px; height: 500px; overflow: hidden;
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
}
.banner {
    width: 1024px; height: 500px;
    background: linear-gradient(135deg, #08080d 0%, #111120 40%, #0d0d18 70%, #08080d 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    overflow: hidden;
}
.glow1 {
    position: absolute; top: -100px; left: -50px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%);
}
.glow2 {
    position: absolute; bottom: -80px; right: 50px;
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
}
.glow3 {
    position: absolute; top: 50px; right: 200px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
}
.line-accent {
    position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, #f59e0b, #f97316, transparent);
}
.content {
    display: flex; align-items: center; gap: 50px;
    position: relative; z-index: 2;
}
.icon-box {
    width: 140px; height: 140px;
    background: linear-gradient(145deg, #0d0d15, #111118);
    border-radius: 32px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(245,158,11,0.2);
    box-shadow: 0 0 60px rgba(245,158,11,0.15), 0 10px 40px rgba(0,0,0,0.5);
    flex-shrink: 0;
}
.icon-s {
    font-size: 80px; font-weight: 800;
    background: linear-gradient(160deg, #f59e0b, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.text-block { display: flex; flex-direction: column; gap: 8px; }
.app-name {
    font-size: 56px; font-weight: 800;
    background: linear-gradient(90deg, #f0f0f5, #d0d0dd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -1px;
}
.tagline {
    font-size: 22px; font-weight: 500;
    background: linear-gradient(90deg, #f59e0b, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.features {
    display: flex; gap: 20px; margin-top: 6px;
    font-size: 14px; color: #666677;
}
.features span {
    padding: 5px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    color: #9999aa;
}
</style></head>
<body>
<div class="banner">
    <div class="glow1"></div>
    <div class="glow2"></div>
    <div class="glow3"></div>
    <div class="line-accent"></div>
    <div class="content">
        <div class="icon-box">
            <div class="icon-s">S</div>
        </div>
        <div class="text-block">
            <div class="app-name">Solis OS</div>
            <div class="tagline">AI-Powered Business Management</div>
            <div class="features">
                <span>Bookings</span>
                <span>CRM</span>
                <span>WhatsApp AI</span>
                <span>Analytics</span>
                <span>Marketing</span>
            </div>
        </div>
    </div>
</div>
</body></html>""")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUTDIR}/playstore-feature-graphic.png")
    print("Created: playstore-feature-graphic.png")
    page.close()

    browser.close()
    print("Done!")
