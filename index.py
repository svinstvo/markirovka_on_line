from aiohttp import web
import datetime
import configparser
from km import *
import asyncpg
import aioredis
import web_interface
import work_with_db
import plc_connector
import os

async def readconfig(app):
    config = configparser.ConfigParser()
    config.read("settings.conf")
    app['remote_server'] = await asyncpg.create_pool(dsn=config.get("server", "remote_server_dsn"), min_size=1,
                                                     max_size=3)
    app['local_server'] = await asyncpg.create_pool(dsn=config.get("server", "local_server_dsn"), min_size=1,
                                                    max_size=3)
    app['local_db_table_name'] = config.get("server", "local_db_table_name")
    app['redis_pool'] = aioredis.ConnectionPool.from_url(config.get("server", "redis_dsn"),
                                                         password=config.get("server", "redis_pass"), max_connections=3)
    app['time_between_reload_stat'] = int(config.get("server", "time_between_reload_stat"))
    return


async def start_server(app):
    await readconfig(app)
    print(app['remote_server'])
    print(app['local_server'])
    app['current_gtin'] = ""
    app['current_product_name'] = ""
    app['current_batch_date'] = datetime.date(2022, 1, 1)
    app['status'] = {"state": 0, "message": "ВСЕ ХОРОШО"}
    app['counters'] = {"total_codes": 0, "good_codes": 0, "defect_codes": 0}
    app['ws'] = []

    # app['remote_server'] = await asyncpg.create_pool(dsn="postgresql://postgres:111111@10.10.3.105:5432/markirovka",
    #                                           min_size=1, max_size=3)
    # app['local_server'] = await asyncpg.create_pool(dsn="postgresql://postgres:111111@10.10.3.105:5432/markirovka",
    #                                          min_size=1, max_size=3)

    asyncio.create_task(work_with_db.load_counters_from_db(app, loop=True))
    asyncio.create_task(plc_connector.socket_server(app))


async def close_pool(app):
    app['remote_server'].close()
    app['local_server'].close()
    await app['remote_server'].wait_closed()
    await app['local_server'].wait_closed()


app = web.Application()
app.add_routes([
    web.get('/line/km/add', km_add),
    web.get('/line/statistic', web_interface.get_statistic),
    web.get('/line/web_interface/set_gtin', web_interface.set_current_gtin),
    web.get('/line/web_interface/set_current_batch_date', web_interface.set_current_batch_date),
    web.get('/line/web_interface/get_available_product_list', web_interface.get_available_product_list),
    web.get('/line/ws', web_interface.websocket_handler),
    web.static('/line/static_files/',os.path.abspath(os.getcwd()),show_index=True)
])
print(os.path.abspath(os.getcwd()))
app.on_startup.append(start_server)
# app.on_cleanup.append(close_pool)
config = configparser.ConfigParser()
config.read("settings.conf")
web.run_app(app, host=config.get("server", "listen_address"), port=int(config.get("server", "listen_port")))
