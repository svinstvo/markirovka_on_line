from aiohttp import web
import asyncio
import aioredis
import web_interface
import work_with_db


async def km_add(request):
    redis = aioredis.Redis(connection_pool=request.app['redis_pool'])
    # km = request.match_info['km']
    raw_km = request.rel_url.query['km']
    gtin = request.app["current_gtin"]
    cod_gp=request.app["current_cod_gp"]
    batch_date = request.app['current_batch_date']
    redis_timeout=request.app['redis_timeout']

    if gtin == "":
        asyncio.create_task(web_interface.show_error("Не выбран продукт"))
        return web.Response(text="no selected product")

    if batch_date == "":
        asyncio.create_task(web_interface.show_error("Не выбрана дата производства"))
        return web.Response(text="Не выбрана дата производства")

    request.app['last_10_codes'] = request.app['last_10_codes'][-9:]
    if raw_km[:6].upper() == "NOREAD":
        km = raw_km[:6]
        status = "noread"
        response_text = "noread"
        getting_gtin = ""
        getting_tail, getting_crypto_tail = "", ""
        request.app['last_10_codes'].append(km)
        request.app['counters']['defect_codes'] += 1
        request.app['status']["state"] = 1
        request.app['status']["message"] = "Неудачная попытка чтения 2D кода"
    else:
        try:
            print(f'->{raw_km}<-')
            getting_gtin = raw_km[3:16]
            getting_tail = raw_km[18:24]
            getting_crypto_tail = raw_km[27:31]
        except Exception as e:
            print(e)
            print('ne razobrat')
            asyncio.create_task(work_with_db.save_logs(app=request.app, message=e))
            getting_gtin = ''
            getting_tail = ""
            getting_crypto_tail = ""

        if getting_gtin!=gtin:
            request.app['counters']['defect_codes'] += 1
            status = "wrong_product"
            response_text = "duplicate"
            request.app['last_10_codes'].append("Не тот продукт " + raw_km)
            request.app['status']['state'] = 1
            request.app['status']['message'] = "Не тот продукт"

        else:
            if request.app["enable_unique_check"] == 1:
                try:
                    inserted_rows = await asyncio.wait_for(redis.sadd(getting_gtin, getting_tail), timeout=redis_timeout)
                    # inserted_rows = await redis.sadd(getting_gtin, getting_tail)
                except Exception as e:
                    print(e)
                    inserted_rows = 1
                    asyncio.create_task(work_with_db.save_logs(app=request.app,message=e))
            else:
                inserted_rows = 1
            if inserted_rows == 1:
                # print('add')
                status = "verified"
                request.app['counters']['good_codes'] += 1
                response_text = "ok"
                request.app['last_10_codes'].append(raw_km)
                request.app['status']['state'] = 0
                request.app['status']['message'] = 'Все хорошо'
            else:
                # print(request.app['counters'])
                request.app['counters']['duplicates_codes'] += 1
                status = "duplicate"
                response_text = "duplicate"
                request.app['last_10_codes'].append("Повторный " + raw_km)
                request.app['status']['state'] = 1
                request.app['status']['message'] = "Дублирование кода"

    # print(request.app['status'])
    request.app['counters']['total_codes'] += 1
    asyncio.create_task(web_interface.ws_send_update(request.app))
    asyncio.create_task(work_with_db.save_into_db(request.app, cod_gp,getting_gtin, getting_tail, getting_crypto_tail, batch_date,
                                                  status))  # Записываем в локальную бд
    return web.Response(text=response_text)
