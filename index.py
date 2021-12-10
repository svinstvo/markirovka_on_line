from collections import defaultdict

from aiohttp import web
from km import *
import asyncpg
import aioredis
import web_interface
import work_with_db
import datetime

remote_server_dsn = "postgresql://postgres:111111@10.10.3.105:5432/markirovka"
local_server_dsn = "postgresql://postgres:111111@10.10.3.105:5432/markirovka"
redis_dsn = "redis://192.168.100.122/0"
redis_pass = "Admin61325!"
local_db_table_name = "line_1"
time_between_reload_stat = 5


async def create_pool(app):
    app['remote_server'] = await asyncpg.create_pool(dsn=remote_server_dsn, min_size=1, max_size=3)
    app['local_server'] = await asyncpg.create_pool(dsn=local_server_dsn, min_size=1, max_size=3)
    app['local_db_table_name'] = local_db_table_name
    app['redis_pool'] = aioredis.ConnectionPool.from_url(redis_dsn, password=redis_pass, max_connections=3)
    app['time_between_reload_stat'] = time_between_reload_stat
    app['current_gtin'] = ""
    app['current_product_name'] = ""
    app['current_batch_date'] = datetime.date(1, 1, 1)
    app['status'] = ""
    app['counters'] = {"total_codes": 0, "good_codes": 0, "defect_codes": 0}
    app['ws'] = []
    asyncio.create_task(work_with_db.load_counters_from_db(app, loop=True))


async def close_pool(app):
    app['remote_server'].close()
    app['local_server'].close()
    await app['remote_server'].wait_closed()
    await app['local_server'].wait_closed()


app = web.Application()
app.add_routes([
    web.get('/line/km/add/{km}', km_add),
    web.get('/line/statistic', web_interface.get_statistic),
    web.get('/line/web_interface/set_gtin/{gtin}', web_interface.set_current_gtin),
    web.get('/line/web_interface/set_current_batch_date/{date}', web_interface.set_current_batch_date),
    web.get('/line/web_interface/get_available_product_list', web_interface.get_available_product_list),
    web.get('/line/ws', web_interface.websocket_handler)
])

app.on_startup.append(create_pool)
# app.on_cleanup.append(close_pool)

web.run_app(app, host='0.0.0.0', port=8090)
