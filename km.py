from aiohttp import web
import asyncio
import aioredis
import web_interface
import work_with_db


async def km_add(request):
    redis = aioredis.Redis(connection_pool=request.app['redis_pool'])
    # km = request.match_info['km']
    km = request.rel_url.query['km']
    gtin = request.app["current_gtin"]
    batch_date = request.app['current_batch_date']
    if gtin == "":
        asyncio.create_task(web_interface.show_error("Не выбран продукт"))
        return web.Response(text="no selected product")
    if batch_date == "":
        asyncio.create_task(web_interface.show_error("Не выбрана дата производства"))
        return web.Response(text="Не выбрана дата производства")

    request.app['last_10_codes'] = request.app['last_10_codes'][-9:]
    if km[:6].upper() == "NOREAD":
        km=km[:6]
        status = "noread"
        response_text = "noread"
        request.app['last_10_codes'].append(km)
        request.app['counters']['defect_codes'] += 1
        request.app['status'] = {"state": 1, "message": "Код не прочелся","debug_mode": 0}
    else:
        inserted_rows = await redis.sadd("km", km)
        #print(inserted_rows)
        #print(km)
        if inserted_rows == 1:
            #print('add')
            status = "verified"
            request.app['counters']['good_codes'] += 1
            response_text = "ok"
            request.app['last_10_codes'].append(km)
            request.app['status'] = {"state": 0, "message": "Все хорошо","debug_mode": 0}
        else:
            #print(request.app['counters'])
            request.app['counters']['duplicates_codes'] += 1
            status = "duplicate"
            response_text = "duplicate"
            request.app['last_10_codes'].append("Повторный "+ km)
            request.app['status'] = {"state": 1, "message": "Дублирование кода","debug_mode": 0}

    #print(request.app['status'])
    request.app['counters']['total_codes'] += 1
    asyncio.create_task(web_interface.ws_send_update(request.app))
    asyncio.create_task(work_with_db.save_into_db(request, km, gtin, batch_date, status))  # Записываем в локальную бд
    return web.Response(text=response_text)
