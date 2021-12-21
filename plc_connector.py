import asyncio
import aiohttp


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

#Метки приходят в ответ 1 или 0
async def handle_port2000(reader, writer):
    while True:
        try:
            data = await reader.read(100)
            #print(f"->{data}<- raw receive om 2000")
            message = data.decode()
            print(f"->{message}<- receive on 2000")
            writer.write(b"1 ")
            await writer.drain()
        except Exception as e:
            print(e)
            writer.write(b'1')
            print("send 1 on 2000 port")
            await writer.drain()

#пинг контроллера что слышим то и передаем
async def handle_port2001(reader, writer):
    while True:
        try:
            data = await reader.read(100)
            #print(f"->{data}<- raw receive om 2001")
            message = data.decode()
            print(f"->{message}<- receive on 2001")
            writer.write(data)
            await writer.drain()
        except Exception as e:
            print(e)
            writer.write(b'1 ')
            print("send 1 on 2001 port")
            await writer.drain()

#принимаем два инта, в ответ настройки
async def handle_port2002(reader, writer):
    while True:
        try:
            data = await reader.read(100)
            #print(f"->{data}<- raw receive om 2002")
            message = data.decode()
            print(f"->{message}<- receive on 2002")
            writer.write(data)
            await writer.drain()
        except Exception as e:
            print(e)


async def handle_port2004(reader, writer):
    while True:
        try:
            data = await reader.read(100)
            print(f"->{data}<- raw receive on 2004")
            message = data.decode()
            print(f"->{message}<- receive on 2004")
            writer.write(data)
            await writer.drain()
        except Exception as e:
            print(e)


async def start_servers(app):
    loop = asyncio.get_event_loop()
    # server_km = await asyncio.start_server(handle_km, '0.0.0.0', 2000, loop=loop)
    # addr = server_km.sockets[0].getsockname()
    # print(f'server for data from scanners run  on {addr}')
    # await asyncio.start_server(handle_km, '0.0.0.0', 2001, loop=loop, start_serving=True)

    await asyncio.start_server(handle_port2000, '0.0.0.0', 2000, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2001, '0.0.0.0', 2001, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2002, '0.0.0.0', 2002, loop=loop, start_serving=True)
    await asyncio.start_server(handle_port2004, '0.0.0.0', 2004, loop=loop, start_serving=True)

    # async with server:
    #    await server.serve_forever()
