from aiohttp import web
from datetime import datetime
import asyncio
import json
import work_with_db


async def show_error(message):
    print(message)
    return


async def ws_send_update(app):
    print("ws send")
    print(app['ws'])
    for ws in app['ws']:
        await ws.send_str("update")
    return


async def get_statistic(request):
    print(request.app["counters"])
    prepared_dict = {}
    prepared_dict.update(request.app["counters"])
    prepared_dict.update({"current_gtin": request.app['current_gtin']})
    prepared_dict.update({"current_product_name": request.app['current_product_name']})
    prepared_dict.update({"current_batch_date": request.app['current_batch_date'].strftime("%Y-%m-%d")})
    json_responce = json.dumps(prepared_dict)
    return web.Response(text=json_responce, content_type="application/json")


async def set_current_gtin(request):
    # request.app['current_gtin'] = request.match_info['gtin']
    request.app['current_gtin'] = request.rel_url.query['gtin']
    request.app['current_product_name'] = "Тут будет Название продукта"
    asyncio.create_task(work_with_db.load_counters_from_db(request.app, loop=False))
    await work_with_db.load_counters_from_db(request.app, loop=False)
    asyncio.create_task(ws_send_update(request.app))
    return web.Response(text="ok")


async def get_available_product_list(request):
    text = '''{
   "55555":"Тестовая фигня",
   "4602547000169":"УЛЬТРАПАСТЕРИЗОВАННОЕ КЛЕВЕРОК 2,5% 0,5Л",
   "4602547000695":"Ультрапастеризованное Топлёное Клевер 4,0% 1л.",
   "4602547000015":"УЛЬТРАПАСТЕРИЗОВАННОЕ КЛЕВЕР 3,5% 1Л",
   "4602547000022":"СЛИВКИ УЛЬТРАПАСТЕРИЗОВАННЫЕ КЛЕВЕР 10% 500Г"
    }'''
    return web.Response(text=text, content_type="application/json")


async def set_current_batch_date(request):
    # raw_date = request.match_info['date']
    raw_date = request.rel_url.query['date']
    print(raw_date)
    try:
        date = datetime.strptime(raw_date, '%Y-%m-%d')
        request.app['current_batch_date'] = date
        await work_with_db.load_counters_from_db(request.app, loop=False)
        asyncio.create_task(ws_send_update(request.app))
        responce_text = "ok"

    except:
        responce_text = f"Неправильный формат даты. Ожидается формат YYYY-MM-DD, а получен {raw_date}"
    return web.Response(text=responce_text)


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    request.app['ws'].append(ws)
    print(request.app['ws'])
    try:
        while True:
            a = await ws.receive_str()
            print(a)
    except Exception as e:
        print(e)
    finally:
        request.app['ws'].remove(ws)
        print("removed")
        print(request.app['ws'])
    return


def get_controller_settings(requets):
    json='''{
   "time_break_no_read":100000,
   "time_break_no_gap":100000,
   "time_impulse":100000,
   "debug_mode":1,
   "time_imp_uakov":1000000,
   "fail_to_brake_count":3
    }'''
    return web.Response(text=json, content_type="application/json")
