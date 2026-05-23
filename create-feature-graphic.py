from playwright.sync_api import sync_playwright
import base64, os

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS'
LOGO_PATH = '/var/lib/freelancer/projects/40373506/ChatGPT Image May 17, 2026, 09_46_29 PM.jpg'

with open(LOGO_PATH, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode()

with sync_playwright() as p:
    browser = p.chromium.launch()

    # Feature Graphic 1024x500
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
.content {{ display: flex; align-items: center; gap: 45px; position: relative; z-index: 2; }}
.logo-img {{
    width: 150px; height: 150px; object-fit: contain;
    filter: drop-shadow(0 0 30px rgba(245,158,11,0.3));
}}
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
        <img class="logo-img" src="data:image/jpeg;base64,{logo_b64}" />
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

    # 10-inch tablet screenshots - min 1080px per side
    # Using 1920x1200 (16:10)
    TABLET_CSS = f"""
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1920px; height: 1200px; overflow: hidden; font-family: -apple-system, 'SF Pro Display', sans-serif; }}
.wrapper {{ width: 1920px; height: 1200px; display: flex; align-items: center; justify-content: center; position: relative; }}
.bg {{ position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(160deg, #0a0a12 0%, #111120 40%, #0d0d18 100%); z-index: 0; }}
.glow1 {{ position: absolute; top: -10%; left: -5%; width: 40%; height: 60%; background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%); z-index: 1; }}
.glow2 {{ position: absolute; bottom: -10%; right: 0; width: 35%; height: 50%; background: radial-gradient(circle, rgba(59,100,246,0.06) 0%, transparent 70%); z-index: 1; }}
.content {{ z-index: 2; display: flex; align-items: center; gap: 80px; padding: 60px 100px; }}
.text-side {{ flex: 1; }}
.feature-title {{ font-size: 64px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.5px; margin-bottom: 12px; }}
.feature-subtitle {{ font-size: 28px; color: #9999aa; font-weight: 400; margin-bottom: 30px; }}
.feature-list {{ list-style: none; }}
.feature-list li {{ font-size: 24px; color: #ccccdd; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 14px; }}
.feature-list .dot {{ width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }}
.phone-frame {{
    width: 380px; min-width: 380px; background: #111118; border-radius: 40px;
    border: 2px solid rgba(255,255,255,0.1); overflow: hidden;
    box-shadow: 0 0 60px rgba(245,158,11,0.12), 0 15px 40px rgba(0,0,0,0.4);
    position: relative;
}}
.phone-frame::before {{ content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 20px; background: #08080d; border-radius: 0 0 14px 14px; z-index: 10; }}
.phone-screen {{ background: #08080d; padding: 30px 16px 16px; }}
.status-bar {{ display: flex; justify-content: space-between; font-size: 12px; color: #f0f0f5; font-weight: 600; padding: 0 4px 6px; }}
.header-greeting {{ font-size: 12px; color: #9999aa; }}
.header-business {{ font-size: 20px; font-weight: 700; color: #f0f0f5; margin-top: 2px; }}
.stats-row {{ display: flex; gap: 8px; margin-top: 10px; }}
.stat-card {{ flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px; }}
.stat-value {{ font-size: 20px; font-weight: 700; }}
.stat-value.amber {{ color: #f59e0b; }}
.stat-value.blue {{ color: #3b82f6; }}
.stat-value.green {{ color: #22c55e; }}
.stat-value.purple {{ color: #a855f7; }}
.stat-label {{ font-size: 10px; color: #9999aa; margin-top: 2px; }}
.section-title {{ font-size: 14px; font-weight: 600; color: #f0f0f5; margin-top: 12px; padding: 2px 0; }}
.appointment-card {{ display: flex; align-items: center; gap: 10px; margin-top: 6px; padding: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }}
.appt-time {{ font-size: 11px; color: #f59e0b; font-weight: 600; min-width: 48px; }}
.appt-name {{ font-size: 13px; color: #f0f0f5; font-weight: 500; }}
.appt-service {{ font-size: 10px; color: #9999aa; }}
.appt-status {{ font-size: 9px; padding: 3px 8px; border-radius: 12px; font-weight: 600; margin-left: auto; }}
.appt-status.confirmed {{ background: rgba(34,197,94,0.15); color: #22c55e; }}
.appt-status.pending {{ background: rgba(245,158,11,0.15); color: #f59e0b; }}
.bottom-nav {{ display: flex; justify-content: space-around; padding: 10px 0 6px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 12px; }}
.nav-item {{ text-align: center; font-size: 9px; color: #555566; }}
.nav-item.active {{ color: #f59e0b; }}
.nav-icon {{ font-size: 16px; margin-bottom: 2px; }}
.logo-mark {{ position: absolute; bottom: 25px; right: 50px; z-index: 2; font-size: 18px; color: rgba(245,158,11,0.4); font-weight: 700; letter-spacing: 2px; }}
"""

    phone_html = """
<div class="phone-screen">
    <div class="status-bar"><span>9:41</span><span>●●●</span></div>
    <div class="header-greeting">Good morning</div>
    <div class="header-business">Zizo Barber Shop</div>
    <div class="stats-row">
        <div class="stat-card"><div class="stat-value amber">$2,450</div><div class="stat-label">Revenue</div></div>
        <div class="stat-card"><div class="stat-value blue">18</div><div class="stat-label">Bookings</div></div>
    </div>
    <div class="stats-row">
        <div class="stat-card"><div class="stat-value green">94%</div><div class="stat-label">Show Rate</div></div>
        <div class="stat-card"><div class="stat-value purple">47</div><div class="stat-label">New</div></div>
    </div>
    <div class="section-title">Today's Schedule</div>
    <div class="appointment-card">
        <div class="appt-time">10:00</div>
        <div><div class="appt-name">Marcus Johnson</div><div class="appt-service">Fade + Beard Trim</div></div>
        <div class="appt-status confirmed">Confirmed</div>
    </div>
    <div class="appointment-card">
        <div class="appt-time">10:45</div>
        <div><div class="appt-name">David Chen</div><div class="appt-service">Full Package</div></div>
        <div class="appt-status pending">Pending</div>
    </div>
    <div class="appointment-card">
        <div class="appt-time">11:30</div>
        <div><div class="appt-name">Sarah Williams</div><div class="appt-service">Hair Coloring</div></div>
        <div class="appt-status confirmed">Confirmed</div>
    </div>
    <div class="bottom-nav">
        <div class="nav-item active"><div class="nav-icon">📊</div>Dashboard</div>
        <div class="nav-item"><div class="nav-icon">📅</div>Bookings</div>
        <div class="nav-item"><div class="nav-icon">👥</div>Customers</div>
        <div class="nav-item"><div class="nav-icon">⋯</div>More</div>
    </div>
</div>
"""

    screens = [
        {"file": "tablet10-01.png", "title": "Your Business at a Glance", "subtitle": "Real-time dashboard with all the metrics that matter",
         "features": ["Live revenue tracking", "Appointment overview", "Customer analytics", "Staff performance", "Today's schedule at a glance"]},
        {"file": "tablet10-02.png", "title": "AI-Powered Management", "subtitle": "Everything your service business needs in one app",
         "features": ["AI WhatsApp Assistant", "Smart booking system", "Built-in CRM", "Marketing & promotions", "Invoicing & expenses"]},
    ]

    for screen in screens:
        features_html = "".join(f'<li><span class="dot"></span>{f}</li>' for f in screen["features"])
        page = browser.new_page(viewport={"width": 1920, "height": 1200})
        page.set_content(f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{TABLET_CSS}</style></head>
<body>
<div class="wrapper">
    <div class="bg"></div><div class="glow1"></div><div class="glow2"></div>
    <div class="content">
        <div class="text-side">
            <div class="feature-title">{screen['title']}</div>
            <div class="feature-subtitle">{screen['subtitle']}</div>
            <ul class="feature-list">{features_html}</ul>
        </div>
        <div class="phone-frame">{phone_html}</div>
    </div>
    <div class="logo-mark">SOLIS OS</div>
</div>
</body></html>""")
        page.wait_for_timeout(300)
        outpath = os.path.join(OUTDIR, 'playstore-screenshots', screen['file'])
        page.screenshot(path=outpath)
        print(f"Created: {screen['file']}")
        page.close()

    browser.close()
    print("All done!")
