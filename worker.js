export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "*").split(",").map(x => x.trim());
    const allowOrigin = allowed.includes("*") || allowed.includes(origin) ? (allowed.includes("*") ? "*" : origin) : "null";
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers});
    if (request.method === "OPTIONS") return new Response(null, {headers});
    if (allowOrigin === "null") return json({success:false,error:"Origin not allowed"},403);

    try {
      const url = new URL(request.url);
      if (url.pathname === "/" || url.pathname === "/health")
        return json({ok:true,service:"Ngermany API",database:"connected"});

      if (url.pathname === "/api/categories" && request.method === "GET") {
        const r = await env.DB.prepare("SELECT id,name,slug,description,image_url FROM categories ORDER BY name").all();
        return json({success:true,categories:r.results});
      }

      if (url.pathname === "/api/products" && request.method === "GET") {
        const r = await env.DB.prepare(`
          SELECT p.id,p.name,p.description,p.price,p.discount_price,p.stock,p.image_url,
                 p.category_id,c.name AS category_name
          FROM products p LEFT JOIN categories c ON c.id=p.category_id
          WHERE p.status='active' ORDER BY p.id DESC
        `).all();
        return json({success:true,products:r.results.map(p=>{
          const price=Number(p.discount_price || p.price || 0);
          const old=Number(p.price || 0);
          return {...p,price,old,discount:old>price?Math.round((old-price)/old*100):0};
        })});
      }

      if (url.pathname === "/api/orders" && request.method === "POST") {
        const body = await request.json();
        const customer=body.customer||{}, recipient=body.recipient||{}, items=body.items||[];
        if (!customer.full_name || !/^[0-9+\-\s]{10,20}$/.test(customer.phone||"") ||
            !recipient.address || !Array.isArray(items) || !items.length || items.length>30)
          return json({success:false,error:"اطلاعات سفارش ناقص یا نامعتبر است."},400);

        const validated=[];
        for (const item of items) {
          const qty=Number(item.quantity), id=Number(item.product_id);
          if (!Number.isInteger(qty)||qty<1||qty>50||!Number.isInteger(id))
            return json({success:false,error:"تعداد یا شناسه محصول نامعتبر است."},400);
          const p=await env.DB.prepare("SELECT id,name,price,discount_price,stock FROM products WHERE id=? AND status='active'").bind(id).first();
          if(!p || Number(p.stock)<qty) return json({success:false,error:"موجودی یکی از محصولات کافی نیست."},409);
          validated.push({id:p.id,name:p.name,price:Number(p.discount_price||p.price),qty});
        }

        const total=validated.reduce((s,x)=>s+x.price*x.qty,0);
        const shipping=Math.max(0,Math.min(100000000,Number(body.shipping_cost)||0));
        const phone=customer.phone.trim();
        await env.DB.prepare(`
          INSERT INTO customers(full_name,phone,email) VALUES(?,?,?)
          ON CONFLICT(phone) DO UPDATE SET full_name=excluded.full_name
        `).bind(customer.full_name.trim(),phone,customer.email||null).run();
        const saved=await env.DB.prepare("SELECT id FROM customers WHERE phone=?").bind(phone).first();
        const orderNo="NG-"+Date.now()+"-"+crypto.randomUUID().slice(0,6).toUpperCase();
        const created=await env.DB.prepare(`
          INSERT INTO orders(customer_id,order_number,total_price,shipping_cost,status,payment_status,
            recipient_name,phone,province,city,address,postal_code)
          VALUES(?,?,?,?, 'pending','unpaid',?,?,?,?,?,?)
        `).bind(saved.id,orderNo,total,shipping,recipient.full_name||customer.full_name,phone,
          recipient.province||"",recipient.city||"",recipient.address,recipient.postal_code||"").run();
        const orderId=created.meta.last_row_id;
        const stmts=[];
        for(const x of validated){
          stmts.push(env.DB.prepare("INSERT INTO order_items(order_id,product_id,product_name,price,quantity) VALUES(?,?,?,?,?)")
            .bind(orderId,x.id,x.name,x.price,x.qty));
          stmts.push(env.DB.prepare("UPDATE products SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND stock>=?")
            .bind(x.qty,x.id,x.qty));
        }
        await env.DB.batch(stmts);
        return json({success:true,order_id:orderId,order_number:orderNo,total_price:total+shipping,payment_status:"unpaid"},201);
      }
      return json({success:false,error:"مسیر پیدا نشد."},404);
    } catch(e) {
      return json({success:false,error:"خطای سرور",detail:e.message},500);
    }
  }
};