from playwright.sync_api import sync_playwright
import os

OUTDIR = '/var/lib/freelancer/projects/40373506/SolisOS/playstore-screenshots'

screens = [
    {
        "file": "01-dashboard.png",
        "title": "Your Business at a Glance",
        "subtitle": "Real-time analytics & insights",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="header">
                <div class="header-greeting">Good morning, Joseph</div>
                <div class="header-business">Zizo Barber Shop</div>
            </div>
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-value amber">$2,450</div>
                    <div class="stat-label">Today's Revenue</div>
                    <div class="stat-change up">↑ 12%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value blue">18</div>
                    <div class="stat-label">Appointments</div>
                    <div class="stat-change up">↑ 5</div>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-value green">94%</div>
                    <div class="stat-label">Show Rate</div>
                    <div class="stat-change up">↑ 3%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value purple">47</div>
                    <div class="stat-label">New Customers</div>
                    <div class="stat-change up">↑ 8</div>
                </div>
            </div>
            <div class="section-title">Today's Schedule</div>
            <div class="appointment-card">
                <div class="appt-time">10:00 AM</div>
                <div class="appt-info">
                    <div class="appt-name">Marcus Johnson</div>
                    <div class="appt-service">Fade Haircut + Beard Trim</div>
                </div>
                <div class="appt-status confirmed">Confirmed</div>
            </div>
            <div class="appointment-card">
                <div class="appt-time">10:45 AM</div>
                <div class="appt-info">
                    <div class="appt-name">David Chen</div>
                    <div class="appt-service">Full Service Package</div>
                </div>
                <div class="appt-status pending">Pending</div>
            </div>
            <div class="appointment-card">
                <div class="appt-time">11:30 AM</div>
                <div class="appt-info">
                    <div class="appt-name">Sarah Williams</div>
                    <div class="appt-service">Hair Coloring</div>
                </div>
                <div class="appt-status confirmed">Confirmed</div>
            </div>
            <div class="bottom-nav">
                <div class="nav-item active"><div class="nav-icon">📊</div><div>Dashboard</div></div>
                <div class="nav-item"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item"><div class="nav-icon">👥</div><div>Customers</div></div>
                <div class="nav-item"><div class="nav-icon">⋯</div><div>More</div></div>
            </div>
        </div>
        """
    },
    {
        "file": "02-bookings.png",
        "title": "Smart Booking Management",
        "subtitle": "Never miss an appointment",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="header">
                <div class="header-title">Bookings</div>
                <div class="date-selector">
                    <span class="date-btn">◀</span>
                    <span class="date-current">Wed, May 14</span>
                    <span class="date-btn">▶</span>
                </div>
            </div>
            <div class="day-tabs">
                <div class="day-tab">Mon<br><span>12</span></div>
                <div class="day-tab">Tue<br><span>13</span></div>
                <div class="day-tab active">Wed<br><span>14</span></div>
                <div class="day-tab">Thu<br><span>15</span></div>
                <div class="day-tab">Fri<br><span>16</span></div>
            </div>
            <div class="timeline">
                <div class="time-slot">
                    <div class="time-label">9:00</div>
                    <div class="booking-block amber-block">
                        <div class="block-name">Alex Turner</div>
                        <div class="block-service">Classic Haircut</div>
                        <div class="block-duration">30 min · $35</div>
                    </div>
                </div>
                <div class="time-slot">
                    <div class="time-label">9:30</div>
                    <div class="booking-block blue-block">
                        <div class="block-name">James Wilson</div>
                        <div class="block-service">Beard Sculpting</div>
                        <div class="block-duration">45 min · $40</div>
                    </div>
                </div>
                <div class="time-slot">
                    <div class="time-label">10:00</div>
                    <div class="empty-slot">Available</div>
                </div>
                <div class="time-slot">
                    <div class="time-label">10:30</div>
                    <div class="booking-block green-block">
                        <div class="block-name">Maria Lopez</div>
                        <div class="block-service">Hair Color + Cut</div>
                        <div class="block-duration">90 min · $120</div>
                    </div>
                </div>
                <div class="time-slot">
                    <div class="time-label">11:00</div>
                    <div class="booking-block purple-block">
                        <div class="block-name">Ryan Park</div>
                        <div class="block-service">Premium Package</div>
                        <div class="block-duration">60 min · $85</div>
                    </div>
                </div>
            </div>
            <div class="fab">+</div>
            <div class="bottom-nav">
                <div class="nav-item"><div class="nav-icon">📊</div><div>Dashboard</div></div>
                <div class="nav-item active"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item"><div class="nav-icon">👥</div><div>Customers</div></div>
                <div class="nav-item"><div class="nav-icon">⋯</div><div>More</div></div>
            </div>
        </div>
        """
    },
    {
        "file": "03-customers.png",
        "title": "Know Every Customer",
        "subtitle": "Built-in CRM for your business",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="header">
                <div class="header-title">Customers</div>
                <div class="search-bar">🔍 Search customers...</div>
            </div>
            <div class="customer-stats-row">
                <div class="cust-stat"><span class="cust-stat-val">284</span><br>Total</div>
                <div class="cust-stat"><span class="cust-stat-val amber-text">47</span><br>New</div>
                <div class="cust-stat"><span class="cust-stat-val green-text">92%</span><br>Retention</div>
            </div>
            <div class="customer-card">
                <div class="avatar" style="background: linear-gradient(135deg, #f59e0b, #f97316);">MJ</div>
                <div class="cust-info">
                    <div class="cust-name">Marcus Johnson</div>
                    <div class="cust-detail">12 visits · Last: 2 days ago</div>
                    <div class="cust-tags"><span class="tag vip">VIP</span><span class="tag loyal">Loyal</span></div>
                </div>
                <div class="cust-spend">$840</div>
            </div>
            <div class="customer-card">
                <div class="avatar" style="background: linear-gradient(135deg, #3b82f6, #6366f1);">SW</div>
                <div class="cust-info">
                    <div class="cust-name">Sarah Williams</div>
                    <div class="cust-detail">8 visits · Last: 1 week ago</div>
                    <div class="cust-tags"><span class="tag regular">Regular</span></div>
                </div>
                <div class="cust-spend">$560</div>
            </div>
            <div class="customer-card">
                <div class="avatar" style="background: linear-gradient(135deg, #22c55e, #14b8a6);">DC</div>
                <div class="cust-info">
                    <div class="cust-name">David Chen</div>
                    <div class="cust-detail">5 visits · Last: 3 days ago</div>
                    <div class="cust-tags"><span class="tag new">New</span></div>
                </div>
                <div class="cust-spend">$275</div>
            </div>
            <div class="customer-card">
                <div class="avatar" style="background: linear-gradient(135deg, #a855f7, #ec4899);">RP</div>
                <div class="cust-info">
                    <div class="cust-name">Ryan Park</div>
                    <div class="cust-detail">15 visits · Last: yesterday</div>
                    <div class="cust-tags"><span class="tag vip">VIP</span><span class="tag loyal">Loyal</span></div>
                </div>
                <div class="cust-spend">$1,120</div>
            </div>
            <div class="customer-card">
                <div class="avatar" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">ML</div>
                <div class="cust-info">
                    <div class="cust-name">Maria Lopez</div>
                    <div class="cust-detail">3 visits · Last: 2 weeks ago</div>
                    <div class="cust-tags"><span class="tag atrisk">At Risk</span></div>
                </div>
                <div class="cust-spend">$195</div>
            </div>
            <div class="bottom-nav">
                <div class="nav-item"><div class="nav-icon">📊</div><div>Dashboard</div></div>
                <div class="nav-item"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item active"><div class="nav-icon">👥</div><div>Customers</div></div>
                <div class="nav-item"><div class="nav-icon">⋯</div><div>More</div></div>
            </div>
        </div>
        """
    },
    {
        "file": "04-whatsapp.png",
        "title": "AI WhatsApp Assistant",
        "subtitle": "24/7 automated customer support",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="header" style="padding-bottom: 12px;">
                <div class="header-title">AI WhatsApp Assistant</div>
            </div>
            <div class="wa-status-bar connected">
                <span class="wa-dot"></span> Connected · +44 770 016 8964
            </div>
            <div class="chat-container">
                <div class="chat-bubble incoming">
                    <div class="chat-sender">Customer</div>
                    Hi, I'd like to book a haircut for tomorrow please
                    <div class="chat-time">2:14 PM</div>
                </div>
                <div class="chat-bubble outgoing ai">
                    <div class="chat-sender">🤖 AI Assistant</div>
                    Hello! I'd love to help you book an appointment at Zizo Barber Shop! 💈

We have the following available slots for tomorrow:

✅ 10:00 AM
✅ 11:30 AM
✅ 2:00 PM
✅ 3:30 PM

Which time works best for you?
                    <div class="chat-time">2:14 PM</div>
                </div>
                <div class="chat-bubble incoming">
                    <div class="chat-sender">Customer</div>
                    2pm would be great
                    <div class="chat-time">2:15 PM</div>
                </div>
                <div class="chat-bubble outgoing ai">
                    <div class="chat-sender">🤖 AI Assistant</div>
                    Perfect! I've booked you in for tomorrow at 2:00 PM for a haircut.

📋 Booking confirmed:
📅 Thursday, May 15
🕐 2:00 PM
💇 Classic Haircut - $35

You'll receive a reminder 1 hour before. See you tomorrow! 😊
                    <div class="chat-time">2:15 PM</div>
                </div>
            </div>
            <div class="wa-stats">
                <div class="wa-stat"><span class="ws-val">156</span><br>Messages Today</div>
                <div class="wa-stat"><span class="ws-val">23</span><br>Auto-Booked</div>
                <div class="wa-stat"><span class="ws-val">98%</span><br>Response Rate</div>
            </div>
            <div class="bottom-nav">
                <div class="nav-item"><div class="nav-icon">📊</div><div>Dashboard</div></div>
                <div class="nav-item"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item"><div class="nav-icon">👥</div><div>Customers</div></div>
                <div class="nav-item"><div class="nav-icon">⋯</div><div>More</div></div>
            </div>
        </div>
        """
    },
    {
        "file": "05-analytics.png",
        "title": "Powerful Analytics",
        "subtitle": "Data-driven business decisions",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="header">
                <div class="header-title">Analytics</div>
                <div class="period-tabs">
                    <span class="period-tab">Day</span>
                    <span class="period-tab active">Week</span>
                    <span class="period-tab">Month</span>
                    <span class="period-tab">Year</span>
                </div>
            </div>
            <div class="revenue-card">
                <div class="rev-label">Weekly Revenue</div>
                <div class="rev-amount">$8,240</div>
                <div class="rev-change up">↑ 18% vs last week</div>
                <div class="chart-area">
                    <svg viewBox="0 0 320 100" class="chart-svg">
                        <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4"/>
                                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <path d="M0,80 L45,65 L90,70 L135,45 L180,50 L225,30 L270,20 L320,15 L320,100 L0,100Z" fill="url(#chartGrad)"/>
                        <path d="M0,80 L45,65 L90,70 L135,45 L180,50 L225,30 L270,20 L320,15" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
                        <circle cx="320" cy="15" r="4" fill="#f59e0b"/>
                    </svg>
                    <div class="chart-labels">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>
            </div>
            <div class="section-title">Top Services</div>
            <div class="service-bar-item">
                <div class="svc-info"><span class="svc-name">Classic Haircut</span><span class="svc-count">45 bookings</span></div>
                <div class="svc-bar"><div class="svc-fill" style="width: 90%; background: #f59e0b;"></div></div>
            </div>
            <div class="service-bar-item">
                <div class="svc-info"><span class="svc-name">Beard Trim</span><span class="svc-count">32 bookings</span></div>
                <div class="svc-bar"><div class="svc-fill" style="width: 65%; background: #3b82f6;"></div></div>
            </div>
            <div class="service-bar-item">
                <div class="svc-info"><span class="svc-name">Full Package</span><span class="svc-count">28 bookings</span></div>
                <div class="svc-bar"><div class="svc-fill" style="width: 56%; background: #22c55e;"></div></div>
            </div>
            <div class="service-bar-item">
                <div class="svc-info"><span class="svc-name">Hair Coloring</span><span class="svc-count">15 bookings</span></div>
                <div class="svc-bar"><div class="svc-fill" style="width: 30%; background: #a855f7;"></div></div>
            </div>
            <div class="bottom-nav">
                <div class="nav-item"><div class="nav-icon">📊</div><div>Dashboard</div></div>
                <div class="nav-item"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item"><div class="nav-icon">👥</div><div>Customers</div></div>
                <div class="nav-item"><div class="nav-icon">⋯</div><div>More</div></div>
            </div>
        </div>
        """
    },
    {
        "file": "06-online-booking.png",
        "title": "Online Booking Page",
        "subtitle": "Customers book 24/7",
        "html": """
        <div class="phone-screen">
            <div class="status-bar">
                <span>9:41</span>
                <span class="status-icons">●●● 🔋</span>
            </div>
            <div class="booking-header">
                <div class="biz-logo-circle">Z</div>
                <div class="biz-name-large">Zizo Barber Shop</div>
                <div class="biz-tagline">Premium Grooming Experience</div>
                <div class="biz-rating">⭐⭐⭐⭐⭐ 4.9 (127 reviews)</div>
            </div>
            <div class="section-title" style="margin-top:8px;">Select a Service</div>
            <div class="booking-service selected">
                <div class="bsvc-check">✓</div>
                <div class="bsvc-info">
                    <div class="bsvc-name">Classic Haircut</div>
                    <div class="bsvc-meta">30 min</div>
                </div>
                <div class="bsvc-price">$35</div>
            </div>
            <div class="booking-service">
                <div class="bsvc-check empty"></div>
                <div class="bsvc-info">
                    <div class="bsvc-name">Beard Sculpting</div>
                    <div class="bsvc-meta">20 min</div>
                </div>
                <div class="bsvc-price">$25</div>
            </div>
            <div class="booking-service">
                <div class="bsvc-check empty"></div>
                <div class="bsvc-info">
                    <div class="bsvc-name">Full Service Package</div>
                    <div class="bsvc-meta">60 min</div>
                </div>
                <div class="bsvc-price">$85</div>
            </div>
            <div class="section-title">Pick a Date</div>
            <div class="date-grid">
                <div class="dg-cell">14<br><small>Wed</small></div>
                <div class="dg-cell selected-date">15<br><small>Thu</small></div>
                <div class="dg-cell">16<br><small>Fri</small></div>
                <div class="dg-cell">17<br><small>Sat</small></div>
                <div class="dg-cell">18<br><small>Sun</small></div>
            </div>
            <div class="section-title">Available Times</div>
            <div class="time-grid">
                <div class="time-chip">9:00</div>
                <div class="time-chip selected-time">10:00</div>
                <div class="time-chip">11:30</div>
                <div class="time-chip">1:00</div>
                <div class="time-chip">2:30</div>
                <div class="time-chip">4:00</div>
            </div>
            <div class="book-btn">Book Now</div>
            <div class="bottom-nav">
                <div class="nav-item"><div class="nav-icon">🏠</div><div>Home</div></div>
                <div class="nav-item"><div class="nav-icon">🔍</div><div>Explore</div></div>
                <div class="nav-item active"><div class="nav-icon">📅</div><div>Bookings</div></div>
                <div class="nav-item"><div class="nav-icon">👤</div><div>Profile</div></div>
            </div>
        </div>
        """
    }
]

CSS = """
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 1080px; height: 1920px;
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
    overflow: hidden;
}
.wrapper {
    width: 1080px; height: 1920px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative;
}
.bg-gradient {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(160deg, #0a0a12 0%, #111120 40%, #0d0d18 100%);
    z-index: 0;
}
.bg-glow1 {
    position: absolute; top: 10%; left: -10%; width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
    z-index: 1;
}
.bg-glow2 {
    position: absolute; bottom: 15%; right: -5%; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
    z-index: 1;
}
.feature-label {
    text-align: center; z-index: 2; margin-bottom: 40px;
}
.feature-title {
    font-size: 52px; font-weight: 700; color: #f0f0f5;
    letter-spacing: -0.5px; margin-bottom: 8px;
}
.feature-subtitle {
    font-size: 28px; color: #9999aa; font-weight: 400;
}
.phone-frame {
    width: 420px; height: 1380px;
    background: #111118;
    border-radius: 48px;
    border: 3px solid rgba(255,255,255,0.1);
    overflow: hidden;
    z-index: 2;
    box-shadow: 0 0 80px rgba(245,158,11,0.15), 0 20px 60px rgba(0,0,0,0.5);
    position: relative;
}
.phone-frame::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 140px; height: 28px;
    background: #08080d; border-radius: 0 0 20px 20px;
    z-index: 10;
}
.phone-screen {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    background: #08080d;
    padding: 0;
    overflow: hidden;
}
.status-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 40px 24px 8px; font-size: 14px; color: #f0f0f5; font-weight: 600;
}
.header {
    padding: 12px 20px 8px;
}
.header-greeting { font-size: 15px; color: #9999aa; }
.header-business { font-size: 24px; font-weight: 700; color: #f0f0f5; margin-top: 2px; }
.header-title { font-size: 24px; font-weight: 700; color: #f0f0f5; }
.stats-row {
    display: flex; gap: 10px; padding: 6px 20px;
}
.stat-card {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 14px;
}
.stat-value { font-size: 26px; font-weight: 700; }
.stat-value.amber { color: #f59e0b; }
.stat-value.blue { color: #3b82f6; }
.stat-value.green { color: #22c55e; }
.stat-value.purple { color: #a855f7; }
.stat-label { font-size: 12px; color: #9999aa; margin-top: 2px; }
.stat-change { font-size: 12px; margin-top: 4px; }
.stat-change.up { color: #22c55e; }
.section-title {
    font-size: 16px; font-weight: 600; color: #f0f0f5;
    padding: 12px 20px 6px;
}
.appointment-card {
    display: flex; align-items: center; gap: 12px;
    margin: 4px 20px; padding: 12px 14px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
}
.appt-time { font-size: 13px; color: #f59e0b; font-weight: 600; min-width: 60px; }
.appt-info { flex: 1; }
.appt-name { font-size: 14px; color: #f0f0f5; font-weight: 500; }
.appt-service { font-size: 12px; color: #9999aa; }
.appt-status { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
.appt-status.confirmed { background: rgba(34,197,94,0.15); color: #22c55e; }
.appt-status.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.bottom-nav {
    margin-top: auto;
    display: flex; justify-content: space-around;
    padding: 10px 0 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
    background: #08080d;
}
.nav-item { text-align: center; font-size: 11px; color: #555566; }
.nav-item.active { color: #f59e0b; }
.nav-icon { font-size: 20px; margin-bottom: 2px; }
/* Bookings screen */
.date-selector { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
.date-btn { color: #f59e0b; font-size: 16px; cursor: pointer; }
.date-current { color: #f0f0f5; font-size: 16px; font-weight: 500; }
.day-tabs { display: flex; gap: 8px; padding: 8px 20px; }
.day-tab {
    flex: 1; text-align: center; font-size: 13px; color: #9999aa;
    padding: 8px 0; border-radius: 12px;
    background: rgba(255,255,255,0.04);
}
.day-tab span { font-weight: 700; font-size: 18px; color: #f0f0f5; }
.day-tab.active { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.day-tab.active span { color: #f59e0b; }
.timeline { flex: 1; overflow: hidden; padding: 8px 20px; }
.time-slot { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.time-label { font-size: 13px; color: #555566; min-width: 45px; padding-top: 10px; }
.booking-block {
    flex: 1; padding: 10px 14px; border-radius: 12px; border-left: 3px solid;
}
.amber-block { background: rgba(245,158,11,0.1); border-color: #f59e0b; }
.blue-block { background: rgba(59,130,246,0.1); border-color: #3b82f6; }
.green-block { background: rgba(34,197,94,0.1); border-color: #22c55e; }
.purple-block { background: rgba(168,85,247,0.1); border-color: #a855f7; }
.block-name { font-size: 14px; color: #f0f0f5; font-weight: 500; }
.block-service { font-size: 12px; color: #9999aa; }
.block-duration { font-size: 11px; color: #555566; margin-top: 2px; }
.empty-slot { flex: 1; padding: 12px; color: #555566; font-size: 13px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 12px; text-align: center; }
.fab {
    position: absolute; bottom: 70px; right: 20px;
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: #fff; font-weight: 300;
    box-shadow: 0 4px 20px rgba(245,158,11,0.4);
}
/* Customer screen */
.search-bar {
    margin-top: 8px; padding: 10px 14px; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
    color: #555566; font-size: 14px;
}
.customer-stats-row { display: flex; gap: 8px; padding: 10px 20px; }
.cust-stat {
    flex: 1; text-align: center; font-size: 12px; color: #9999aa;
    background: rgba(255,255,255,0.04); border-radius: 12px; padding: 10px;
}
.cust-stat-val { font-size: 22px; font-weight: 700; color: #f0f0f5; }
.amber-text { color: #f59e0b !important; }
.green-text { color: #22c55e !important; }
.customer-card {
    display: flex; align-items: center; gap: 12px;
    margin: 3px 20px; padding: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
}
.avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff;
}
.cust-info { flex: 1; }
.cust-name { font-size: 14px; color: #f0f0f5; font-weight: 500; }
.cust-detail { font-size: 11px; color: #9999aa; }
.cust-tags { display: flex; gap: 4px; margin-top: 4px; }
.tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.tag.vip { background: rgba(245,158,11,0.15); color: #f59e0b; }
.tag.loyal { background: rgba(34,197,94,0.15); color: #22c55e; }
.tag.regular { background: rgba(59,130,246,0.15); color: #3b82f6; }
.tag.new { background: rgba(168,85,247,0.15); color: #a855f7; }
.tag.atrisk { background: rgba(239,68,68,0.15); color: #ef4444; }
.cust-spend { font-size: 16px; font-weight: 700; color: #f59e0b; }
/* WhatsApp screen */
.wa-status-bar {
    margin: 4px 20px; padding: 8px 14px; border-radius: 10px;
    font-size: 13px; display: flex; align-items: center; gap: 8px;
}
.wa-status-bar.connected { background: rgba(34,197,94,0.1); color: #22c55e; }
.wa-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
.chat-container { flex: 1; padding: 10px 20px; overflow: hidden; display: flex; flex-direction: column; gap: 8px; }
.chat-bubble {
    max-width: 85%; padding: 10px 14px; border-radius: 16px;
    font-size: 13px; line-height: 1.4; color: #f0f0f5; white-space: pre-line;
}
.chat-bubble.incoming {
    align-self: flex-start; background: rgba(255,255,255,0.06);
    border-bottom-left-radius: 4px;
}
.chat-bubble.outgoing {
    align-self: flex-end; background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.2);
    border-bottom-right-radius: 4px;
}
.chat-sender { font-size: 11px; font-weight: 600; color: #f59e0b; margin-bottom: 4px; }
.chat-bubble.incoming .chat-sender { color: #9999aa; }
.chat-time { font-size: 10px; color: #555566; text-align: right; margin-top: 4px; }
.wa-stats { display: flex; gap: 8px; padding: 8px 20px; }
.wa-stat {
    flex: 1; text-align: center; font-size: 11px; color: #9999aa;
    background: rgba(255,255,255,0.04); border-radius: 10px; padding: 8px;
}
.ws-val { font-size: 20px; font-weight: 700; color: #f0f0f5; }
/* Analytics screen */
.period-tabs { display: flex; gap: 6px; margin-top: 8px; }
.period-tab {
    padding: 6px 16px; border-radius: 20px; font-size: 13px;
    color: #9999aa; background: rgba(255,255,255,0.04);
}
.period-tab.active { background: rgba(245,158,11,0.15); color: #f59e0b; }
.revenue-card {
    margin: 10px 20px; padding: 16px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
}
.rev-label { font-size: 13px; color: #9999aa; }
.rev-amount { font-size: 36px; font-weight: 700; color: #f0f0f5; }
.rev-change { font-size: 13px; margin-bottom: 8px; }
.rev-change.up { color: #22c55e; }
.chart-area { margin-top: 4px; }
.chart-svg { width: 100%; height: 80px; }
.chart-labels { display: flex; justify-content: space-between; font-size: 11px; color: #555566; }
.service-bar-item { padding: 6px 20px; }
.svc-info { display: flex; justify-content: space-between; margin-bottom: 4px; }
.svc-name { font-size: 13px; color: #f0f0f5; }
.svc-count { font-size: 12px; color: #9999aa; }
.svc-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; }
.svc-fill { height: 100%; border-radius: 3px; }
/* Booking page screen */
.booking-header {
    text-align: center; padding: 40px 20px 12px;
    background: linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%);
}
.biz-logo-circle {
    width: 64px; height: 64px; margin: 0 auto 8px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700; color: #fff;
}
.biz-name-large { font-size: 22px; font-weight: 700; color: #f0f0f5; }
.biz-tagline { font-size: 13px; color: #9999aa; margin-top: 2px; }
.biz-rating { font-size: 13px; color: #f59e0b; margin-top: 6px; }
.booking-service {
    display: flex; align-items: center; gap: 12px;
    margin: 4px 20px; padding: 14px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
}
.booking-service.selected { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.06); }
.bsvc-check { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.bsvc-check:not(.empty) { background: #f59e0b; color: #fff; font-weight: 700; }
.bsvc-check.empty { border: 2px solid rgba(255,255,255,0.15); }
.bsvc-info { flex: 1; }
.bsvc-name { font-size: 15px; color: #f0f0f5; font-weight: 500; }
.bsvc-meta { font-size: 12px; color: #9999aa; }
.bsvc-price { font-size: 18px; font-weight: 700; color: #f59e0b; }
.date-grid { display: flex; gap: 8px; padding: 4px 20px; }
.dg-cell {
    flex: 1; text-align: center; padding: 10px 0;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; color: #f0f0f5; font-size: 18px; font-weight: 600;
}
.dg-cell small { font-size: 11px; color: #9999aa; font-weight: 400; }
.dg-cell.selected-date { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #f59e0b; }
.dg-cell.selected-date small { color: #f59e0b; }
.time-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 20px; }
.time-chip {
    padding: 10px 20px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #f0f0f5; font-size: 14px; font-weight: 500;
}
.time-chip.selected-time { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #f59e0b; }
.book-btn {
    margin: 12px 20px; padding: 16px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    border-radius: 14px; text-align: center;
    color: #fff; font-size: 18px; font-weight: 700;
    box-shadow: 0 4px 20px rgba(245,158,11,0.3);
}
.logo-watermark {
    position: absolute; bottom: 30px;
    text-align: center; z-index: 2;
    font-size: 18px; color: rgba(245,158,11,0.5);
    font-weight: 700; letter-spacing: 2px;
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()

    for screen in screens:
        page = browser.new_page(viewport={"width": 1080, "height": 1920})

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
<div class="wrapper">
    <div class="bg-gradient"></div>
    <div class="bg-glow1"></div>
    <div class="bg-glow2"></div>
    <div class="feature-label">
        <div class="feature-title">{screen['title']}</div>
        <div class="feature-subtitle">{screen['subtitle']}</div>
    </div>
    <div class="phone-frame">
        {screen['html']}
    </div>
    <div class="logo-watermark">SOLIS OS</div>
</div>
</body>
</html>"""

        page.set_content(html)
        page.wait_for_timeout(500)
        outpath = os.path.join(OUTDIR, screen['file'])
        page.screenshot(path=outpath)
        print(f"Created: {outpath}")
        page.close()

    browser.close()
    print("All screenshots generated!")
