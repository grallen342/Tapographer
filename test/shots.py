# Screenshots of every screen (desktop + phone) against the mocked backend. Usage: python3 test/shots.py OUTDIR
import asyncio, os, subprocess, sys, time, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "site")); TEST = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(TEST, "shots", "ui"); os.makedirs(OUT, exist_ok=True)
MOCK = open(os.path.join(TEST, "mock-supabase.js")).read()
CFG = 'window.TAPO_CONFIG = {SUPABASE_URL: "https://test.supabase.co", SUPABASE_ANON_KEY: "test"};'
SEED = r'''(()=>{ if (localStorage.mockdb) return; const now=Date.now(), iso=t=>new Date(t).toISOString(), today=(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")})();
 const P=(id,u,av,col,r,g,avg,best,extra)=>Object.assign({id,username:u,avatar:av,color:col,is_admin:false,banned:false,created_at:iso(now-9e8),last_played:iso(now-3e6),games:g,score_sum:avg*g,avg,best,bullseyes:3,rating:r,rated_games:g,rating_hist:[{r,t:now},{r:r-20,t:now-1e8},{r:r-45,t:now-2e8},{r:r-10,t:now-3e8},{r:r-60,t:now-4e8}],recent:[{s:avg+40,m:"random",t:now},{s:avg-80,m:"daily",t:now-1e8},{s:avg+10,m:"random",t:now-2e8},{s:avg-30,m:"duel",t:now-3e8},{s:avg+90,m:"random",t:now-4e8}],daily:null,streak:2,blitz_games:3,blitz_best:410,region_games:2,region_best:380},extra||{});
 const db={users:[{id:"g",email:"greg@example.com",password:"globetrot1",confirmed:true},{id:"m",email:"maya@example.com",password:"x",confirmed:true},{id:"b",email:"bob@example.com",password:"x",confirmed:true},{id:"s",email:"sam@example.com",password:"x",confirmed:false},{id:"j",email:"jo@example.com",password:"x",confirmed:true}],
  profiles:[P("g","Greg","🌍","#FFC857",1084,12,742,931,{is_admin:true}),P("m","Maya","🦊","#C58BFF",1162,18,801,968,{daily:{date:today,score:874,raws:[100,95,88,90,79]}}),P("b","Bob","🐢","#7AA7FF",987,7,655,812,{daily:{date:today,score:702,raws:[98,80,60,85,50]}}),P("s","Sam","🚀","#5ED0E8",1000,2,610,690),P("j","Jo","🌵","#B8E05A",1031,9,701,880)],
  games:[], duels:[{id:"d1",challenger:"m",opponent:"g",picks:[0,30,60,90,120],created_at:iso(now-5e6),challenger_score:812,opponent_score:null,rated:false},{id:"d2",challenger:"g",opponent:"b",picks:[1,31,61,91,121],created_at:iso(now-9e7),challenger_score:790,opponent_score:701,rated:true},{id:"d3",challenger:"g",opponent:"j",picks:[2,32,62,92,122],created_at:iso(now-2e7),challenger_score:655,opponent_score:null,rated:false}],
  settings:{id:1,signups_open:true,invite_code:null,announcement:null,daily_bonus:true}, session:null, seq:1};
 ["random","daily","duel","random","blitz"].forEach((m,i)=>db.games.push({id:i+1,user_id:["g","m","b","g","j"][i],mode:m,score:[742,874,702,810,410][i],max:m==="blitz"?500:1000,raws:[100,95,80,70,60],places:["Paris","Seoul","Petra","Waterloo","Nuuk"],rating:1080,delta:[12,20,-8,15,null][i],created_at:iso(now-i*4e6)}));
 localStorage.mockdb=JSON.stringify(db); })();'''
async def main():
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8766", "-d", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    base = "http://127.0.0.1:8766/"
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for label, vp, dsf in [("d", {'width':1280,'height':800}, 1), ("m", {'width':390,'height':844}, 2)]:
            ctx = await b.new_context(viewport=vp, device_scale_factor=dsf)
            await ctx.add_init_script(MOCK); await ctx.add_init_script(SEED)
            async def route(r):
                u = r.request.url
                if u.endswith("/config.js"): return await r.fulfill(body=CFG, content_type="application/javascript")
                if u.startswith(base): return await r.continue_()
                return await r.abort()
            await ctx.route("**/*", route)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(base); await pg.wait_for_selector('#loading', state='hidden', timeout=60000); await pg.wait_for_timeout(400)
            shot = lambda n, **k: pg.screenshot(path=os.path.join(OUT, f"{label}_{n}.png"), **k)
            await shot("01_login")
            await pg.click('#auth .tabs button:nth-child(2)'); await pg.wait_for_timeout(200); await shot("02_signup")
            await pg.click('#auth .tabs button:nth-child(1)')
            await pg.fill('#login', 'greg'); await pg.fill('#password', 'globetrot1'); await pg.click('#authcard form button[type=submit]'); await pg.wait_for_timeout(900)
            await shot("03_round")
            cx = await pg.evaluate('gcx'); cy = await pg.evaluate('gcy')
            await pg.mouse.click(cx + 30, cy - 25); await pg.wait_for_timeout(300); await shot("04_pin")
            await pg.click('#action'); await pg.wait_for_timeout(1400); await shot("05_reveal")
            for i in range(4):
                await pg.click('#action'); await pg.wait_for_timeout(700)
                cx = await pg.evaluate('gcx'); cy = await pg.evaluate('gcy')
                await pg.mouse.click(cx + 10, cy + 10); await pg.wait_for_timeout(150)
                await pg.click('#action'); await pg.wait_for_timeout(1250)
            await pg.click('#action'); await pg.wait_for_timeout(900); await shot("06_summary")
            await pg.click('#again'); await pg.wait_for_timeout(500)
            await pg.click('#nb-rank'); await pg.wait_for_timeout(300); await shot("07_rank")
            await pg.click('#sheet .tabs button:nth-child(3)'); await pg.wait_for_timeout(200); await shot("08_today"); await pg.click('#sheetx')
            await pg.click('#nb-duel'); await pg.wait_for_timeout(300); await shot("09_duels"); await pg.click('#sheetx')
            await pg.click('#nb-me'); await pg.wait_for_timeout(300); await shot("10_profile"); await pg.click('#sheetx')
            await pg.click('#mode-blitz'); await pg.wait_for_timeout(900); await shot("11_blitz")
            ap = await ctx.new_page(); await ap.goto(base + "admin.html"); await ap.wait_for_timeout(500)
            await ap.screenshot(path=os.path.join(OUT, f"{label}_12_gate.png"))
            await ap.fill('#hostpw', 'globetrot1'); await ap.click('#gatecard form button[type=submit]'); await ap.wait_for_timeout(700)
            await ap.screenshot(path=os.path.join(OUT, f"{label}_13_overview.png"), full_page=True)
            await ap.click('#tabs button[data-tab=players]'); await ap.wait_for_timeout(300); await ap.screenshot(path=os.path.join(OUT, f"{label}_14_players.png"), full_page=True)
            await ap.click('.admintbl tbody tr:nth-child(1)'); await ap.wait_for_timeout(500); await ap.screenshot(path=os.path.join(OUT, f"{label}_15_player.png"), full_page=True)
            await ap.click('#tabs button[data-tab=settings]'); await ap.wait_for_timeout(300); await ap.screenshot(path=os.path.join(OUT, f"{label}_16_settings.png"), full_page=True)
            print(label, "errors:", errs)
            await ctx.close()
        await b.close()
    srv.terminate()
asyncio.run(main())
