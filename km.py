from aiohttp import web
import asyncio
import aioredis
import web_interface
import work_with_db


async def km_add(request):
    redis = aioredis.Redis(connection_pool=request.app['redis_pool'])
    km = request.match_info['km']
    gtin = request.app["current_gtin"]
    batch_date = request.app['current_batch_date']
    if gtin == "":
        asyncio.create_task(web_interface.show_error("Не выбран продукт"))
        return web.Response(text="Не выбран продукт")
    if batch_date == "":
        asyncio.create_task(web_interface.show_error("Не выбрана дата производства"))
        return web.Response(text="Не выбрана дата производства")

    inserted_rows = await redis.sadd("km", km)
    print(inserted_rows)
    print(km)

    if inserted_rows == 1:
        print('add')
        asyncio.create_task(work_with_db.save_into_db(request, km, gtin, batch_date))  # Записываем в локальную бд
        request.app['counters']['good_codes'] += 1
        request.app['counters']['total_codes'] += 1
        asyncio.create_task(web_interface.ws_send_update(request.app))
        response_text = "ok"
    else:
        response_text = "duplicate"

    return web.Response(text=response_text)
