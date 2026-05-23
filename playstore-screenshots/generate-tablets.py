from playwright.sync_api import sync_playwright
import os

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS/playstore-screenshots'

CSS = """
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    overflow: hidden;
    font-family: -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center;
}
.wrapper {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    position: relative;
}
.bg {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(160deg, #0a0a12 0%, #111120 40%, #0d0d18 100%);
    z-index: 0;
}
.glow1 {
    position: absolute; top: -10%; left: -5%; width: 40%; height: 60%;
    background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
    z-index: 1;
}
.glow2 {
    position: absolute; bottom: -10%; right: 0; width: 35%; height: 50%;
    background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
    z-index: 1;
}
.content {
    z-index: 2; display: flex; align-items: center; gap: 60px;
    padding: 40px 60px;
}
.text-side { flex: 1; }
.feature-title {
    font-size: 42px; font-weight: 700; color: #f0f0f5;
    letter-spacing: -0.5px; margin-bottom: 8px;
}
.feature-subtitle {
    font-size: 20px; color: #9999aa; font-weight: 400; margin-bottom: 24px;
}
.feature-list { list-style: none; }
.feature-list li {
    font-size: 16px; color: #ccccdd; padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; gap: 10px;
}
.feature-list .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #f59e0b; flex-shrink: 0;
}
.phone-frame {
    width: 280px; min-width: 280px;
    background: #111118; border-radius: 32px;
    border: 2px solid rgba(255,255,255,0.1);
    overflow: hidden;
    box-shadow: 0 0 60px rgba(245,158,11,0.12), 0 15px 40px rgba(0,0,0,0.4);
    position: relative;
}
.phone-frame::before {
    content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 90px; height: 18px; background: #08080d; border-radius: 0 0 14px 14px; z-index: 10;
}
.phone-screen {
    background: #08080d; padding: 28px 14px 14px;
}
.status-bar {
    display: flex; justify-content: space-between; font-size: 11px; color: #f0f0f5;
    font-weight: 600; padding: 0 4px 6px;
}
.header-greeting { font-size: 11px; color: #9999aa; }
.header-business { font-size: 17px; font-weight: 700; color: #f0f0f5; margin-top: 1px; }
.stats-row { display: flex; gap: 6px; margin-top: 8px; }
.stat-card {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 8px;
}
.stat-value { font-size: 16px; font-weight: 700; }
.stat-value.amber { color: #f59e0b; }
.stat-value.blue { color: #3b82f6; }
.stat-value.green { color: #22c55e; }
.stat-value.purple { color: #a855f7; }
.stat-label { font-size: 9px; color: #9999aa; margin-top: 1px; }
.section-title { font-size: 12px; font-weight: 600; color: #f0f0f5; margin-top: 10px; padding: 2px 0; }
.appointment-card {
    display: flex; align-items: center; gap: 8px;
    margin-top: 4px; padding: 8px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
}
.appt-time { font-size: 10px; color: #f59e0b; font-weight: 600; min-width: 42px; }
.appt-name { font-size: 11px; color: #f0f0f5; font-weight: 500; }
.appt-service { font-size: 9px; color: #9999aa; }
.appt-status { font-size: 8px; padding: 3px 7px; border-radius: 12px; font-weight: 600; margin-left: auto; }
.appt-status.confirmed { background: rgba(34,197,94,0.15); color: #22c55e; }
.appt-status.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.bottom-nav {
    display: flex; justify-content: space-around; padding: 8px 0 4px;
    border-top: 1px solid rgba(255,255,255,0.08); margin-top: 10px;
}
.nav-item { text-align: center; font-size: 8px; color: #555566; }
.nav-item.active { color: #f59e0b; }
.nav-icon { font-size: 14px; margin-bottom: 1px; }
.logo-mark {
    position: absolute; bottom: 20px; right: 40px; z-index: 2;
    font-size: 14px; color: rgba(245,158,11,0.4); font-weight: 700; letter-spacing: 2px;
}
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

screens_7 = [
    {
        "file": "tablet7-01.png",
        "title": "Your Business at a Glance",
        "subtitle": "Real-time dashboard with all the metrics that matter",
        "features": [
            "Live revenue tracking",
            "Appointment overview",
            "Customer analytics",
            "Staff performance",
            "Today's schedule at a glance",
        ]
    },
    {
        "file": "tablet7-02.png",
        "title": "AI-Powered Management",
        "subtitle": "Everything your service business needs in one app",
        "features": [
            "AI WhatsApp Assistant",
            "Smart booking system",
            "Built-in CRM",
            "Marketing & promotions",
            "Invoicing & expenses",
        ]
    },
]

with sync_playwright() as p:
    browser = p.chromium.launch()

    for screen in screens_7:
        features_html = "".join(
            f'<li><span class="dot"></span>{f}</li>' for f in screen["features"]
        )

        # 7-inch tablet: 1024x600 (landscape 16:9-ish)
        page = browser.new_page(viewport={"width": 1024, "height": 600})
        html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{CSS}
body {{ width: 1024px; height: 600px; }}
.wrapper {{ width: 1024px; height: 600px; }}
</style></head>
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
</body></html>"""
        page.set_content(html)
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(OUTDIR, screen['file']))
        print(f"Created 7-inch: {screen['file']}")
        page.close()

    # 10-inch tablet: 1280x800 (landscape)
    screens_10 = [
        {**s, "file": s["file"].replace("tablet7", "tablet10")} for s in screens_7
    ]
    for screen in screens_10:
        features_html = "".join(
            f'<li><span class="dot"></span>{f}</li>' for f in screen["features"]
        )
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{CSS}
body {{ width: 1280px; height: 800px; }}
.wrapper {{ width: 1280px; height: 800px; }}
.feature-title {{ font-size: 48px; }}
.feature-subtitle {{ font-size: 22px; }}
.feature-list li {{ font-size: 18px; padding: 10px 0; }}
.phone-frame {{ width: 320px; min-width: 320px; }}
</style></head>
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
</body></html>"""
        page.set_content(html)
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(OUTDIR, screen['file']))
        print(f"Created 10-inch: {screen['file']}")
        page.close()

    browser.close()
    print("All tablet screenshots done!")
