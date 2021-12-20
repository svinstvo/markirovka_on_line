import asyncio
import aiohttp


async def handle_km(reader, writer):
    print(writer)
    while True:
        data = await reader.read(100)
        message = data.decode()
        print(f"->{message}<-")
        if len(message) == 1:
            writer.write(data)
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
        print(f"-->{resp_text}<--")
        if resp_text == "ok":
            writer.write(b'0')
        else:
            writer.write(b'1')
        await writer.drain()

    print("Close the connection")
    writer.close()
    await writer.wait_closed()
    print(writer.is_closing())


async def start_servers(app):
    loop = asyncio.get_event_loop()
    server_km = await asyncio.start_server(handle_km, '0.0.0.0', 2000, loop=loop)
    addr = server_km.sockets[0].getsockname()
    print(f'server for data from scanners run  on {addr}')
    await asyncio.start_server(handle_km, '0.0.0.0', 2001, loop=loop, start_serving=True)

    # async with server:
    #    await server.serve_forever()
