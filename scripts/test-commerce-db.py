"""Exercise money, stock, idempotency and grants in a disposable PostgreSQL container."""
import concurrent.futures, csv, io, json, pathlib, subprocess, uuid

ROOT=pathlib.Path(__file__).resolve().parents[1]
NAME='everything-beaded-db-check-'+uuid.uuid4().hex[:10]
def run(args,input=None,check=True):
    result=subprocess.run(args,input=input,text=True,capture_output=True,encoding='utf8')
    if check and result.returncode: raise RuntimeError(result.stderr)
    return result
def sql(query,role=None,check=True):
    prefix=f'set role {role}; ' if role else ''
    return run(['docker','exec','-i',NAME,'psql','-X','-q','-t','-A','-U','postgres','-v','ON_ERROR_STOP=1'],prefix+query,check)
def value(query,role=None): return sql(query,role).stdout.strip()
def quote(value): return "'"+str(value).replace("'","''")+"'"
def reserve(slug,key,request='request',access='a'*64,amount=2500):
    items=json.dumps([{'slug':slug,'quantity':1}])
    customer=json.dumps({'name':'Test Buyer','email':'buyer@example.test','phone':'+233000000000','address':{'line1':'Test street','city':'Test City','region':'Test Region','countryCode':'GH'}})
    return f"select row_to_json(r) from public.reserve_order({quote(items)}::jsonb,'test-zone',{quote(customer)}::jsonb,'{key}',{quote(request)},{quote(access)},{amount}) r;"
def product(slug,stock=2):
    sql(f"insert into public.products(slug,title,category,price_minor,stock_quantity,published,details_approved) values('{slug}','Test product','earrings',2500,{stock},true,true);")
checks=[]
def passed(label): checks.append(label); print('PASS '+label,flush=True)
def rejected(query,code,role='service_role'):
    result=sql(query,role,False)
    assert result.returncode and code in result.stderr,(code,result.stderr)

try:
    run(['docker','run','--detach','--name',NAME,'--network','none','--mount','type=tmpfs,destination=/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17.11-alpine3.24'])
    run(['docker','exec',NAME,'sh','-c','until pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done'])
    sql('create role anon; create role authenticated; create role service_role bypassrls;')
    sql("""create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,banned_until timestamptz);
      create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),status text,factor_type text);
      create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),factor_id uuid references auth.mfa_factors(id),aal text,not_after timestamptz);
    """)
    for migration in sorted((ROOT/'supabase/migrations').glob('*.sql')): sql(migration.read_text(encoding='utf8'))
    catalogue=json.loads((ROOT/'apps/web/features/catalog/catalogue.json').read_text(encoding='utf8'))
    catalogue_csv=io.StringIO(newline='')
    writer=csv.writer(catalogue_csv,lineterminator='\n')
    for item in catalogue:
        attributes={'colors':item['colors'],'sourceIndices':item['sourceIndices']}
        materials='{'+','.join('"'+material.replace('\\','\\\\').replace('"','\\"')+'"' for material in item['materials'])+'}'
        writer.writerow([item['slug'],item['title'],item['category'],item['subcategory'],item['description'],materials,item['materialStatus'],json.dumps(item['images']),json.dumps(attributes),None,None,True,False,item['sortOrder']])
    sql("copy public.products(slug,title,category,subcategory,description,materials,material_status,images,attributes,price_minor,stock_quantity,published,details_approved,sort_order) from stdin with (format csv);\n"+catalogue_csv.getvalue()+"\\.\n")
    assert value('select count(*) from public.products;')==str(len(catalogue))
    assert value('select count(*) from public.products where price_minor is not null or stock_quantity is not null or details_approved;')=='0'
    passed('complete catalogue imports into the real schema with blank prices and stock')
    product('test-item')
    sql("update public.products set attributes='{\"sizeLabel\":\"Small\",\"contents\":\"One test piece\",\"privateNote\":\"Internal only\"}'::jsonb where slug='test-item';")
    rejected("select public.checkout_quote('[{\"slug\":\"test-item\",\"quantity\":1}]','test-zone');",'ORDERING_UNAVAILABLE')
    sql("update public.store_settings set ordering_enabled=true,prices_include_tax=true,policies_approved=true,support_contact='support@example.test',delivery_policy='Synthetic delivery policy for tests only.',returns_policy='Synthetic returns policy for tests only.',privacy_policy='Synthetic privacy policy for tests only.',terms_policy='Synthetic terms of sale for tests only.';")
    sql("insert into public.delivery_zones values('test-zone','Test delivery','GH',0,true);")
    passed('fresh migration and closed-by-default checkout')
    for role in ['anon','authenticated']:
        rejected('select * from public.orders;','permission denied',role)
        rejected("select public.checkout_quote('[]','test-zone');",'permission denied',role)
        rejected("update public.products set price_minor=1;",'permission denied',role)
    sql("insert into public.products(slug,title,category,published) values('private-draft','Private draft','bags',false);")
    assert value("select count(*) from public.products where slug='private-draft';",'anon')=='0'
    assert value("select count(*) from public.products where slug='test-item';",'anon')=='1'
    passed('RLS and explicit grants deny private data and privileged RPCs')
    key=str(uuid.uuid4())
    rejected(reserve('test-item',key,amount=1),'PRICE_CHANGED')
    assert value("select stock_quantity from public.products where slug='test-item';")=='2'
    order=json.loads(value(reserve('test-item',key),'service_role'))
    repeat=json.loads(value(reserve('test-item',key),'service_role'))
    assert order['id']==repeat['id']
    assert value("select stock_quantity from public.products where slug='test-item';")=='1'
    rejected(reserve('test-item',key,request='changed'),'CHECKOUT_CONFLICT')
    rejected(reserve('test-item',key,access='b'*64),'CHECKOUT_CONFLICT')
    passed('server prices, atomic reservation and idempotent retries')
    snapshot=json.loads(value(f"select product_snapshot from public.order_items where order_id='{order['id']}';"))
    assert snapshot['sizeLabel']=='Small' and snapshot['contents']=='One test piece' and 'privateNote' not in snapshot
    sql("update public.products set attributes='{\"sizeLabel\":\"Changed later\"}'::jsonb where slug='test-item';")
    assert json.loads(value(f"select product_snapshot from public.order_items where order_id='{order['id']}';"))==snapshot
    passed('purchased option and contents snapshots survive catalogue edits without private notes')
    for items in ['[]','[{"slug":"missing","quantity":1}]','[{"slug":"test-item","quantity":0}]','[{"slug":"test-item","quantity":1.5}]','[{"slug":"test-item","quantity":1},{"slug":"test-item","quantity":1}]']:
        assert sql(f'select public.checkout_quote({quote(items)}::jsonb,\'test-zone\');','service_role',False).returncode
    passed('invalid bags, duplicate lines and unavailable products rejected')
    product('race-item',1)
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda _:sql(reserve('race-item',str(uuid.uuid4()),access=uuid.uuid4().hex*2),'service_role',False),range(2)))
    assert sum(r.returncode==0 for r in results)==1
    assert any('STOCK_UNAVAILABLE' in r.stderr for r in results)
    assert value("select stock_quantity from public.products where slug='race-item';")=='0'
    passed('concurrent last-unit purchases cannot oversell')
    verify=f"select public.record_payment('{order['reference']}',2500,'GHS','buyer@example.test');"
    assert value(verify,'service_role')=='paid'
    assert value(verify,'service_role')=='paid'
    assert value(f"select count(*) from public.commerce_jobs where order_id='{order['id']}' and kind='send_receipt';")=='1'
    assert value(f"select fulfillment_status from public.orders where id='{order['id']}';")=='preparing'
    passed('verified payment is idempotent with one durable receipt job')
    for role in ['anon','authenticated']:
        rejected('select * from public.order_events;','permission denied',role)
        rejected('select * from public.order_requests;','permission denied',role)
        rejected(f"select public.request_order_support('{order['id']}','{'a'*64}','question','A test question','{uuid.uuid4()}');",'permission denied',role)
    support_key=str(uuid.uuid4())
    def support(key,access='a'*64,kind='question',message='Please check this test order.'):
        return f"select row_to_json(r) from public.request_order_support('{order['id']}',{quote(access)},{quote(kind)},{quote(message)},'{key}') r;"
    rejected(support(support_key,access='b'*64),'ORDER_NOT_FOUND')
    request=json.loads(value(support(support_key),'service_role'))
    assert json.loads(value(support(support_key),'service_role'))['id']==request['id']
    rejected(support(support_key,message='A different test request.'),'SUPPORT_CONFLICT')
    value(support(str(uuid.uuid4()),kind='cancellation'),'service_role')
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        requests=list(pool.map(lambda _:sql(support(str(uuid.uuid4())),'service_role',False),range(2)))
    assert sum(r.returncode==0 for r in requests)==1
    assert value(f"select count(*) from public.order_requests where order_id='{order['id']}';")=='3'
    passed('support requests enforce guest ownership, grants, idempotency and concurrent open-request limits')
    rejected(f"update public.orders set fulfillment_status='delivered',dispatched_at=now(),delivered_at=now() where id='{order['id']}';",'FULFILLMENT_TRANSITION')
    rejected(f"update public.orders set fulfillment_status='dispatched',dispatched_at=now() where id='{order['id']}';",'TRACKING_REQUIRED')
    dispatch=f"update public.orders set fulfillment_status='dispatched',dispatched_at=now(),tracking_number='TEST-DELIVERY' where id='{order['id']}';"
    rejected(dispatch,'ORDER_REQUEST_REVIEW')
    sql(f"update public.order_requests set status='closed',reply='Test request reviewed.' where order_id='{order['id']}';",'service_role')
    sql(dispatch,'service_role')
    rejected(f"update public.orders set fulfillment_status='preparing' where id='{order['id']}';",'FULFILLMENT_TRANSITION')
    rejected(f"update public.orders set fulfillment_status='delivered',delivered_at=dispatched_at-interval '1 day' where id='{order['id']}';",'DELIVERY_DATE_REQUIRED')
    sql(f"update public.orders set fulfillment_status='delivered',delivered_at=now() where id='{order['id']}';",'service_role')
    assert value(f"select count(*) from public.order_events where order_id='{order['id']}';")=='4'
    assert value("select stock_quantity from public.products where slug='test-item';")=='1'
    passed('fulfillment progresses in order, records events, blocks unresolved cancellation and never rededucts stock')
    product('mismatch-item')
    mismatch=json.loads(value(reserve('mismatch-item',str(uuid.uuid4()),access='c'*64),'service_role'))
    assert value(f"select public.record_payment('{mismatch['reference']}',1,'GHS','buyer@example.test');",'service_role')=='payment_review'
    assert value(f"select reserved from public.orders where id='{mismatch['id']}';")=='t'
    passed('wrong payment amount enters review without fulfillment')
    product('expired-item',1)
    expired=json.loads(value(reserve('expired-item',str(uuid.uuid4()),access='d'*64),'service_role'))
    sql(f"update public.orders set expires_at=now()-interval '1 second' where id='{expired['id']}';")
    for _ in range(2): assert value(f"select public.cancel_unpaid_order('{expired['id']}');",'service_role')=='cancelled'
    assert value("select stock_quantity from public.products where slug='expired-item';")=='1'
    assert value(f"select public.record_payment('{expired['reference']}',2500,'GHS','buyer@example.test');",'service_role')=='payment_review'
    passed('expired unpaid reservations release once; late payment requires review')
    event=f"select public.receive_payment_event('test-event','{order['reference']}');"
    value(event,'service_role');value(event,'service_role')
    assert value("select count(*) from public.payment_inbox where event_hash='test-event';")=='1'
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        claims=list(pool.map(lambda _:value('select coalesce(json_agg(j.id),\'[]\') from public.claim_commerce_jobs() j;','service_role'),range(2)))
    left,right=map(json.loads,claims)
    assert not set(left)&set(right)
    passed('durable webhook dedupe and exclusive concurrent job claims')
    job=json.loads(value(f"select row_to_json(j) from public.commerce_jobs j where order_id='{order['id']}' and kind='verify_payment';"))
    value(f"select public.receive_payment_event('during-claim','{order['reference']}');",'service_role')
    value(f"select public.finish_commerce_job('{job['id']}','{job['lease_token']}','done',null,now()+interval '1 hour');",'service_role')
    assert value(f"select status from public.commerce_jobs where id='{job['id']}';")=='pending'
    value('select count(*) from public.claim_commerce_jobs();','service_role')
    value(f"select public.finish_commerce_job('{job['id']}','{job['lease_token']}','done',null,now());",'service_role')
    assert value(f"select status from public.commerce_jobs where id='{job['id']}';")=='processing'
    passed('events arriving during processing survive and stale workers cannot finish a newer claim')
    actor,session,factor,outsider=[str(uuid.uuid4()) for _ in range(4)]
    sql(f"insert into auth.users(id,email) values('{actor}','merchant@example.test'),('{outsider}','outsider@example.test'); insert into auth.sessions(id,user_id,aal) values('{session}','{actor}','aal1'); insert into public.merchant_approvals(email,role) values('merchant@example.test','owner');")
    access=f"select public.merchant_access('{actor}','{session}',false);"
    rejected(access,'MERCHANT_SESSION')
    sql(f"update auth.users set email_confirmed_at=now() where id='{actor}';")
    assert value(access,'service_role')=='owner'
    assert value('select count(*) from public.merchant_approvals;')=='0'
    rejected(f"select public.merchant_access('{actor}','{session}',true);",'MERCHANT_MFA')
    sql(f"insert into auth.mfa_factors values('{factor}','{actor}','verified','totp');update auth.sessions set aal='aal2',factor_id='{factor}' where id='{session}';")
    assert value(f"select public.merchant_access('{actor}','{session}',true);",'service_role')=='owner'
    for role in ['anon','authenticated']:
        rejected(access,'permission denied',role)
        for table in ['merchant_approvals','merchant_members','merchant_activity','merchant_operations','merchant_media']:
            rejected(f'select * from public.{table};','permission denied',role)
        rejected(f"select merchant_private.assert_access('{actor}','{session}',false);",'permission denied',role)
    rejected("insert into public.merchant_approvals(email,role) values('attacker@example.test','owner');",'permission denied')
    passed('merchant activation requires confirmed approved email and MFA; client roles cannot read data or self-promote')
    def merchant(action,target,revision,data,key=None):
        key=key or str(uuid.uuid4())
        return f"select public.merchant_write('{actor}','{session}','{key}',{quote(action)},{quote(target)},{revision},{quote(json.dumps(data))}::jsonb);"
    pdata={'title':'Synthetic draft','category':'bags','subcategory':'Test bags','description':'Synthetic description for integration testing.','materials':['Test material'],'material_status':'visual','images':['/images/products/test.jpg'],'attributes':{'contents':'One item','colors':['Blue']},'published':False,'details_approved':False}
    value(merchant('product.create','merchant-draft',0,pdata),'service_role')
    assert value("select published from public.products where slug='merchant-draft';")=='f'
    rev=int(value("select revision from public.products where slug='merchant-draft';"))
    key=str(uuid.uuid4());command=merchant('price.save','merchant-draft',rev,{'price_minor':12345},key)
    first=value(command,'service_role');assert value(command,'service_role')==first
    assert value("select count(*) from public.merchant_activity where action='price.save' and target='merchant-draft';")=='1'
    rejected(merchant('price.save','merchant-draft',rev,{'price_minor':999}),'MERCHANT_CONFLICT')
    rejected(merchant('price.save','merchant-draft',rev,{'price_minor':999},key),'MERCHANT_RETRY_CONFLICT')
    passed('merchant drafts and exact prices persist with optimistic conflicts and idempotent audited retries')
    def revision(slug):return int(value(f"select revision from public.products where slug={quote(slug)};"))
    value(merchant('stock.adjust','merchant-draft',revision('merchant-draft'),{'mode':'initial','quantity':5,'reason':'Opening test count'}),'service_role')
    rejected(merchant('stock.adjust','merchant-draft',revision('merchant-draft'),{'mode':'initial','quantity':10,'reason':'Second opening count'}),'MERCHANT_STOCK_INITIALIZED')
    revision_before=revision('merchant-draft')
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        changes=list(pool.map(lambda _:sql(merchant('stock.adjust','merchant-draft',revision_before,{'mode':'adjust','quantity':-4,'reason':'Concurrent adjustment'}),'service_role',False),range(2)))
    assert sorted(r.returncode==0 for r in changes)==[False,True]
    assert value("select stock_quantity from public.products where slug='merchant-draft';")=='1'
    rejected(merchant('stock.adjust','merchant-draft',revision('merchant-draft'),{'mode':'adjust','quantity':-2,'reason':'Too much removed'}),'MERCHANT_STOCK_NEGATIVE')
    sql("update public.products set attributes=attributes || '{\"sourceIndices\":[123]}'::jsonb where slug='merchant-draft';")
    pdata['title']='Edited synthetic draft';value(merchant('product.save','merchant-draft',revision('merchant-draft'),pdata),'service_role')
    assert value("select price_minor||':'||stock_quantity||':'||(attributes->>'sourceIndices') from public.products where slug='merchant-draft';")=='12345:1:[123]'
    passed('concurrent stock edits cannot oversell or overwrite newer state; product edits preserve price stock and source provenance')
    product('merchant-checkout',2)
    before=revision('merchant-checkout'); merchant_order=json.loads(value(reserve('merchant-checkout',str(uuid.uuid4()),access='e'*64),'service_role'))
    rejected(merchant('stock.adjust','merchant-checkout',before,{'mode':'adjust','quantity':1,'reason':'Stale stock edit'}),'MERCHANT_CONFLICT')
    assert value("select stock_quantity from public.products where slug='merchant-checkout';")=='1'
    rejected(merchant('order.fulfill',merchant_order['id'],1,{'status':'dispatched','tracking_number':'TEST'}),'FULFILLMENT_TRANSITION')
    value(f"select public.record_payment('{merchant_order['reference']}',2500,'GHS','buyer@example.test');",'service_role')
    request_id=value(f"select (public.request_order_support('{merchant_order['id']}','{'e'*64}','cancellation','Synthetic customer cancellation question','{uuid.uuid4()}')).id;",'service_role')
    order_revision=lambda:int(value(f"select revision from public.orders where id='{merchant_order['id']}';"))
    rejected(merchant('order.fulfill',merchant_order['id'],order_revision(),{'status':'dispatched','tracking_number':'TEST'}),'ORDER_REQUEST_REVIEW')
    value(merchant('request.reply',request_id,1,{'status':'closed','reply':'Synthetic review resolved; customer confirmed dispatch.'}),'service_role')
    assert value(f"select message from public.order_requests where id='{request_id}';")=='Synthetic customer cancellation question'
    value(merchant('order.fulfill',merchant_order['id'],order_revision(),{'status':'dispatched','tracking_number':'TEST-REF','tracking_url':'https://example.test/track'}),'service_role')
    value(merchant('order.fulfill',merchant_order['id'],order_revision(),{'status':'delivered'}),'service_role')
    assert value("select stock_quantity from public.products where slug='merchant-checkout';")=='1'
    assert value(f"select fulfillment_status from public.orders where id='{merchant_order['id']}';")=='delivered'
    passed('checkout conflicts, customer request resolution and merchant fulfilment preserve payment and stock invariants')
    mutation=merchant('price.save','merchant-draft',revision('merchant-draft'),{'price_minor':20000})
    sql(f"update public.merchant_members set active=false where user_id='{actor}';")
    rejected(mutation,'MERCHANT_FORBIDDEN')
    sql(f"update public.merchant_members set active=true where user_id='{actor}';update auth.sessions set not_after=now()-interval '1 second' where id='{session}';")
    rejected(mutation,'MERCHANT_SESSION')
    sql(f"update auth.sessions set not_after=null where id='{session}';update auth.users set banned_until=now()+interval '1 hour' where id='{actor}';")
    rejected(mutation,'MERCHANT_SESSION')
    sql(f"update auth.users set banned_until=null where id='{actor}';update auth.mfa_factors set status='unverified' where id='{factor}';")
    rejected(mutation,'MERCHANT_MFA')
    sql(f"delete from auth.sessions where id='{session}';")
    rejected(mutation,'MERCHANT_SESSION')
    rejected('update public.merchant_activity set action=\'tampered\';','permission denied')
    passed('membership revocation banned users expired/revoked sessions and removed MFA immediately deny merchant writes; audit is append-only')
    print(json.dumps({'passed':len(checks),'database':'PostgreSQL 17.11','isolated':True,'checks':checks}))
finally:
    # NAME is generated here, not supplied by the caller; no shared database is reset.
    run(['docker','rm','--force',NAME],check=False)
