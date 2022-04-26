import aiohttp
from aiohttp import web
from datetime import datetime
import asyncio
import json
import work_with_db


async def send_statistic_to_servers(app):
    stat_receive_servers = app['stat_receive_servers']
    params = {"session": app['session']}
    while True:

        prepared_dict = {}
        prepared_dict.update({"markstation_id": app['markstation_id']})
        prepared_dict.update({"last_modify_date": app['last_modify_date']})
        prepared_dict.update({"source_date": datetime.now().strftime("%Y-%m-%d")})
        prepared_dict.update(app["counters"])
        prepared_dict.update({"current_gtin": app['current_gtin']})
        prepared_dict.update({"current_cod_gp": app['current_cod_gp']})
        prepared_dict.update({"current_batch_date": app['current_batch_date'].strftime("%Y-%m-%d")})
        prepared_dict["plc_state"] = app['plc_state']
        stat = json.dumps(prepared_dict).encode("utf-8")

        async with aiohttp.ClientSession() as session:
            for server in stat_receive_servers:
                try:
                    print("----------------------------")
                    print(server['url'])
                    print(stat)
                    if "last_counter" in server:
                        print("in")
                        if prepared_dict['total_codes'] != server['last_counter']:
                            resp = await session.post(server['url'], data=stat, params=params, ssl=False)
                            print(f"total={prepared_dict['total_codes']} last_counter = {server['last_counter']}")
                            print(f"response body: {resp}")
                            print(f"response code: {resp.status}")
                            server['last_counter'] = prepared_dict['total_codes']
                        else:
                            print('Counter not changed, dont send.')
                    else:
                        resp = await session.post(server['url'], data=stat, params=params, ssl=False)
                        print(f"response body: {resp}")
                        print(f"response code: {resp.status}")
                except Exception as e:
                    print(e)
        await asyncio.sleep(60)


async def show_error(message):
    print(message)
    return


async def ws_send_update(app):
    # print("ws send")
    # print(app['ws'])
    for ws in app['ws']:
        await ws.send_str("update")
    return


async def get_statistic(request):
    # print(request.app["counters"])
    prepared_dict = {}
    prepared_dict.update(request.app["counters"])
    prepared_dict.update({"current_gtin": request.app['current_gtin']})
    prepared_dict.update({"current_cod_gp": request.app['current_cod_gp']})
    prepared_dict.update({"current_product_name": request.app['current_product_name']})
    prepared_dict.update({"current_batch_date": request.app['current_batch_date'].strftime("%Y-%m-%d")})
    prepared_dict["status"] = request.app['status']
    prepared_dict["last_10_codes"] = request.app['last_10_codes']
    prepared_dict["plc_state"] = request.app['plc_state']
    prepared_dict["plc_last seen"] = (datetime.now() - request.app['plc_last seen']).total_seconds()

    json_responce = json.dumps(prepared_dict)
    return web.Response(text=json_responce, content_type="application/json")


async def set_current_gtin(request):
    # request.app['current_gtin'] = request.match_info['gtin']
    # request.app['current_gtin'] = request.rel_url.query['cod_gp']
    request.app['current_cod_gp'] = request.rel_url.query['cod_gp']
    request.app['current_gtin'] = await work_with_db.get_gtin_by_cod_gp(request.app, request.app['current_cod_gp'])
    await work_with_db.load_counters_from_db(request.app, loop=False)
    asyncio.create_task(ws_send_update(request.app))
    return web.Response(text="ok")


async def get_available_product_list(request):
    text = await work_with_db.get_available_product_list(request.app)
    text = json.dumps(text)
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


async def get_controller_settings(request):
    try:
        request.app['plc_state']['alarm_no_scanner'] = request.rel_url.query['alarm_no_scanner']
        request.app['plc_state']['time_imp_upakovki'] = request.rel_url.query['time_imp_upakovki']
        request.app['plc_state']['scaner_noread_counter'] = request.rel_url.query['scaner_noread_counter']
        request.app['plc_state']['scaner_trigger_counter'] = request.rel_url.query['scaner_trigger_counter']
        request.app['plc_state']['count_no_zapusk_scaner'] = request.rel_url.query['count_no_zapusk_scaner']
        request.app['plc_state']['count_no_trans_metka'] = request.rel_url.query['count_no_trans_metka']
        request.app['plc_state']['count_brak_no_zazor'] = request.rel_url.query['count_brak_no_zazor']
        request.app['plc_state']['time_imp_upakovki_2'] = request.rel_url.query['time_imp_upakovki_2']
        request.app['plc_state']['scaner_noread_counter_2'] = request.rel_url.query['scaner_noread_counter_2']
        request.app['plc_state']['scaner_trigger_counter_2'] = request.rel_url.query['scaner_trigger_counter_2']
        request.app['plc_state']['count_no_zapusk_scaner_2'] = request.rel_url.query['count_no_zapusk_scaner_2']
        request.app['plc_state']['count_no_trans_metka_2'] = request.rel_url.query['count_no_trans_metka_2']
        request.app['plc_state']['count_brak_no_zazor_2'] = request.rel_url.query['count_brak_no_zazor_2']
        request.app['plc_state']['machine_status'] = request.rel_url.query['machine_status']

        try:
            message_from_plc = request.rel_url.query['message_from_plc']
            previous_message_from_plc = request.app['plc_state']['message_from_plc'].split(';')[1]
            if previous_message_from_plc != message_from_plc:
                request.app['plc_state'][
                    'message_from_plc'] = f"{datetime.now().strftime('%H:%M:%S')};{message_from_plc}"
                asyncio.create_task(ws_send_update(request.app))
                asyncio.create_task(
                    work_with_db.save_logs(app=request.app, message=request.app['plc_state']['message_from_plc']))

        except Exception as e:
            request.app['plc_state'][
                'message_from_plc'] = f"{datetime.now().strftime('%H:%M:%S')};{request.rel_url.query['message_from_plc']} "
            print(e)
            asyncio.create_task(work_with_db.save_logs(app=request.app, message=e))

    except Exception as e:
        print(e)
        asyncio.create_task(work_with_db.save_logs(app=request.app, message=e))
    raw = await work_with_db.load_settings_from_db(request.app)
    raw['gtin'] = request.app['current_gtin']
    raw["status"] = request.app['status']
    resp_json = json.dumps(raw)
    return web.Response(text=resp_json, content_type="application/json")


async def update_plc_last_seen(request):
    request.app['plc_last seen'] = datetime.now()
    return web.Response(text="ok", content_type="plain/text")


async def set_controller_settings(request):
    # try:
    plc_settings = {}
    plc_settings['time_imp_upakov'] = request.rel_url.query['time_imp_upakov']
    plc_settings['zadanie_count_brak'] = request.rel_url.query['zadanie_count_brak']
    plc_settings['1_time_brak_no_read'] = request.rel_url.query['1_time_brak_no_read']
    plc_settings['1_time_brak_no_zazor'] = request.rel_url.query['1_time_brak_no_zazor']
    plc_settings['1_time_impulse'] = request.rel_url.query['1_time_impulse']
    plc_settings['1_time_continuous_brak'] = request.rel_url.query['1_time_continuous_brak']
    plc_settings['2_time_brak_no_read'] = request.rel_url.query['2_time_brak_no_read']
    plc_settings['2_time_brak_no_zazor'] = request.rel_url.query['2_time_brak_no_zazor']
    plc_settings['2_time_impulse'] = request.rel_url.query['2_time_impulse']
    plc_settings['2_time_continuous_brak'] = request.rel_url.query['2_time_continuous_brak']
    plc_settings['camera_optimization'] = request.rel_url.query['camera_optimization']

    await work_with_db.save_settings_into_db(request.app, plc_settings)

    # except Exception as e:
    # print(f"set_controller_settings    {e}")
    return web.Response(text="ok", content_type="text/plain")


async def set_debug_mode(request):
    debug_mode = request.rel_url.query['debug_mode']
    request.app['status']['debug_mode'] = debug_mode
    asyncio.create_task(ws_send_update(request.app))
    return web.Response(text="ok", content_type="plain/text")


async def set_and_unset(app, button, duration):
    print(button)
    app["status"][f"button_{button}_pressed"] = 1
    await ws_send_update(app)
    await asyncio.sleep(duration)
    app["status"][f"button_{button}_pressed"] = 0
    await ws_send_update(app)
    print("end button")
    return


async def button_pressed(request):
    button = request.rel_url.query['button']
    asyncio.create_task(set_and_unset(request.app, button, request.app['button_pressed_time_duration']))
    return web.Response(text="ok", content_type="text/plain")
