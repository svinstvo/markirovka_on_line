import asyncio
import datetime

import aiohttp
import sys
import json


async def handle_km(reader, writer):
    print(writer)
    while True:
        data = await reader.read(100)
        message = data.decode()
        print(f"->{message}<- receive")

        # Если прилетает 1 символ значит это тест канала
        if len(message) == 1:
            writer.write(data)
            print(f"->{data}<- send from ping")
            await writer.drain()
            continue

        if message == "quit":
            print("exit loop")
            await writer.drain()
            break

        params = {'km': message}
        async with aiohttp.ClientSession() as session:
            async with session.get("http://127.0.0.1:8090/line/km/add", params=params) as resp:
                resp_status = resp.status
                resp_text = await resp.text()

        addr = writer.get_extra_info('peername')
        print(f"-->{resp_text}<-- send from add_km")
        if resp_text == "ok":
            writer.write(b'0')
        else:
            writer.write(b'1')
        await writer.drain()

    print("Close the connection")
    writer.close()
    await writer.wait_closed()
    print(writer.is_closing())


# Метки приходят в ответ 1 или 0
async def handle_port2000(reader, writer):
    print("new connect 2000")
    while True:
        try:
            data = await reader.read(100)
            # print(f"->{data}<- raw receive om 2000")
            message = data.decode()
            print(f"receive on 2000 ->{message}<- {datetime.datetime.now()}" )
            params = {'km': message}
            async with aiohttp.ClientSession() as session:
                async with session.get("http://127.0.0.1:8090/line/km/add", params=params) as resp:
                    resp_status = resp.status
                    resp_text = await resp.text()
            print(resp_text)
            if resp_text == "ok":
                writer.write(b"\x00\x00\x00\x01")
                print(f"send on 2000 -> x00 x00 x00 x01<- {datetime.datetime.now()}")
            elif resp_text == "noread":
                continue
                print(f"send on 2000 ->noread - no responce<- {datetime.datetime.now()}")
            else:
                writer.write(b"\x00\x00\x00\x00")
                print(f"send on 2000 ->x00 x00 x00 x00<- {datetime.datetime.now()}")
            await writer.drain()
        except Exception as e:
            print(e)
            writer.write(b'1')
            print("send 1 on 2000 port")
            await writer.drain()


# пинг контроллера что слышим то и передаем
async def handle_port2001(reader, writer):
    print("new connect 2001")
    while True:
        try:
            data = await reader.read(100)
            # print(f"->{data}<- raw receive om 2001")
            message = data.decode()
            # print(f"receive on 2001 ->{message}<- ")
            writer.write(data)
            await writer.drain()

            async with aiohttp.ClientSession() as session:
                async with session.get("http://127.0.0.1:8090/line/web_interface/update_plc_last_seen") as resp:
                    resp_status = resp.status
                    resp_text = await resp.text()
        except Exception as e:
            print(e)
            writer.write(b'1 ')
            print("send 1 on 2001 port")
            await writer.drain()


# принимаем статистику от терминала, и строку в ответ настройки
async def handle_port2002(reader, writer):
    print("new connect 2002")
    while True:
        try:

            data = await reader.read(100)
            time_start = datetime.datetime.now()
            #print(f"receive on 2002 ->{data}<- (RAW)")
            # message = data.decode()
            # print(f"receive on 2002 ->{message}<-")
            stat_from_plc = {}
            stat_from_plc['alarm_no_scanner'] = int.from_bytes(data[0:4], byteorder="big")
            stat_from_plc['time_imp_upakovki'] = int.from_bytes(data[4:8], byteorder="big")
            stat_from_plc['scaner_noread_counter'] = int.from_bytes(data[8:12], byteorder="big")
            stat_from_plc['scaner_trigger_counter'] = int.from_bytes(data[12:16], byteorder="big")
            stat_from_plc['count_no_zapusk_scaner'] = int.from_bytes(data[16:20], byteorder="big")
            stat_from_plc['count_no_trans_metka'] = int.from_bytes(data[20:24], byteorder="big")
            stat_from_plc['count_brak_no_zazor'] = int.from_bytes(data[24:28], byteorder="big")
            stat_from_plc['time_imp_upakovki_2'] = int.from_bytes(data[28:32], byteorder="big")
            stat_from_plc['scaner_noread_counter_2'] = int.from_bytes(data[32:36], byteorder="big")
            stat_from_plc['scaner_trigger_counter_2'] = int.from_bytes(data[36:40], byteorder="big")
            stat_from_plc['count_no_zapusk_scaner_2'] = int.from_bytes(data[40:44], byteorder="big")
            stat_from_plc['count_no_trans_metka_2'] = int.from_bytes(data[44:48], byteorder="big")
            stat_from_plc['count_brak_no_zazor_2'] = int.from_bytes(data[48:52], byteorder="big")
            stat_from_plc['machine_status'] = int.from_bytes(data[52:56], byteorder="big")
            stat_from_plc['message_from_plc'] = data[56:88].decode('utf-8')

            async with aiohttp.ClientSession() as session:
                async with session.get("http://127.0.0.1:8090/line/web_interface/get_controller_settings",
                                       params=stat_from_plc) as resp:
                    resp_status = resp.status
                    resp_text = await resp.text()
            settings = json.loads(resp_text)
            plc_jtin = (settings['gtin'].rjust(13)).encode('utf-8')
            naladka = int(settings["status"]["debug_mode"]).to_bytes(4, byteorder="big")

            timp_upakov = int(settings["time_imp_upakov"]).to_bytes(4, byteorder="big")
            zadanie_count_brak = int(settings["zadanie_count_brak"]).to_bytes(4, byteorder="big")
            tbrak_no_read_1 = int(settings["1_time_brak_no_read"]).to_bytes(4, byteorder="big")
            tbrak_no_zazor_1 = int(settings["1_time_brak_no_zazor"]).to_bytes(4, byteorder="big")
            timpulse_1 = int(settings["1_time_impulse"]).to_bytes(4, byteorder="big")
            t_continuous_brak_1 = int(settings["1_time_continuous_brak"]).to_bytes(4, byteorder="big")
            tbrak_no_read_2 = int(settings["2_time_brak_no_read"]).to_bytes(4, byteorder="big")
            tbrak_no_zazor_2 = int(settings["2_time_brak_no_zazor"]).to_bytes(4, byteorder="big")
            timpulse_2 = int(settings["2_time_impulse"]).to_bytes(4, byteorder="big")
            t_continuous_brak2 = int(settings["2_time_continuous_brak"]).to_bytes(4, byteorder="big")

            button_start = int(settings["status"]["button_start_pressed"]).to_bytes(4, byteorder="big")
            button_stop = int(settings["status"]["button_stop_pressed"]).to_bytes(4, byteorder="big")
            button_reset = int(settings["status"]["button_reset_pressed"]).to_bytes(4, byteorder="big")

            to_plc = tbrak_no_read_1 + tbrak_no_zazor_1 + timpulse_1 + naladka + timp_upakov + zadanie_count_brak + \
                     t_continuous_brak_1 + button_start + button_stop + button_reset + tbrak_no_read_2 + \
                     tbrak_no_zazor_2 + timpulse_2+t_continuous_brak2 +plc_jtin + b"\x00"
            #print(f"sending on 2002 ->{to_plc}<- (RAW)")
            writer.write(to_plc)
            await writer.drain()
            time_stop = datetime.datetime.now()
            # print(time_stop-time_start)
        except Exception as e:
            print(f"error   on 2002 {e}")
            writer.close()
            await writer.wait_closed()




async def start_servers(app):
    loop = asyncio.get_event_loop()
    # server_km = await asyncio.start_server(handle_km, '0.0.0.0', 2000, loop=loop)
    # addr = server_km.sockets[0].getsockname()
    # print(f'server for data from scanners run  on {addr}')
    # await asyncio.start_server(handle_km, '0.0.0.0', 2001, loop=loop, start_serving=True)

    await asyncio.start_server(handle_port2000, '0.0.0.0', 2000, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2001, '0.0.0.0', 2001, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2002, '0.0.0.0', 2002, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2000, '0.0.0.0', 2003, loop=loop, start_serving=True)

    # async with server:
    #    await server.serve_forever()
