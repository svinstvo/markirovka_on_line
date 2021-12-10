from collections import defaultdict
from aiohttp import web
import configparser
from km import *
import asyncpg
import aioredis
import web_interface
import work_with_db
import datetime


async def readconfig(app):
    config = configparser.ConfigParser()
    config.read("settings.conf")

    app['remote_server'] = asyncpg.create_pool(dsn=config.get("server", "remote_server_dsn"), min_size=1, max_size=3)
    app['local_server'] = asyncpg.create_pool(dsn=config.get("server", "local_server_dsn"), min_size=1, max_size=3)
    app['local_db_table_name'] = config.get("server", "local_db_table_name")
    app['redis_pool'] = aioredis.ConnectionPool.from_url(config.get("server", "redis_dsn"), password=config.get("server", "redis_pass"), max_connections=3)
    app['time_between_reload_stat'] = int(config.get("server", "time_between_reload_stat"))


async def create_pool(app):
    await readconfig(app)

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
